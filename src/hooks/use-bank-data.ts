"use client";

import { useState, useEffect, useCallback } from 'react';
import type { DailyRecord, Account, FixedDeposit } from '@/lib/types';
import { format, parseISO, isBefore, compareDesc, isValid } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';

export function useBankData() {
    const { user, loading: authLoading } = useAuth();
    const [data, setData] = useState<Record<string, DailyRecord>>({});
    const [loading, setLoading] = useState(true);
    const [hasFetchedInitialData, setHasFetchedInitialData] = useState(false);

    const fetchDailyRecords = useCallback(async () => {
        if (!user) {
            setData({});
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { data: records, error } = await supabase
                .from('daily_records')
                .select(`
                    id,
                    record_date,
                    accounts (
                        id,
                        holder_name,
                        bank_name,
                        account_number,
                        balance,
                        fixed_deposits (
                            id,
                            principal,
                            maturity_date
                        )
                    )
                `)
                .eq('user_id', user.id)
                .order('record_date', { ascending: false });

            if (error) {
                throw error;
            }

            const formattedData: Record<string, DailyRecord> = {};
            records?.forEach(record => {
                const dateStr = format(parseISO(record.record_date), 'yyyy-MM-dd');
                formattedData[dateStr] = {
                    date: dateStr,
                    accounts: record.accounts.map((acc: any) => ({
                        id: acc.id,
                        holderName: acc.holder_name,
                        bankName: acc.bank_name,
                        accountNumber: acc.account_number,
                        balance: acc.balance,
                        fds: acc.fixed_deposits.map((fd: any) => ({
                            id: fd.id,
                            principal: fd.principal,
                            maturityDate: format(parseISO(fd.maturity_date), 'yyyy-MM-dd'),
                        }))
                    }))
                };
            });
            setData(formattedData);
        } catch (error) {
            console.error("Error fetching daily records:", error);
            setData({});
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading && !hasFetchedInitialData) {
            fetchDailyRecords();
            setHasFetchedInitialData(true);
        }
    }, [user, authLoading, fetchDailyRecords, hasFetchedInitialData]);

    const saveData = useCallback(async (date: Date, newRecord: Omit<DailyRecord, 'date'>) => {
        if (!user) {
            console.error("User not authenticated. Cannot save data.");
            return;
        }

        const dateStr = format(date, 'yyyy-MM-dd');

        try {
            // Check if a record for this date already exists
            const { data: existingRecord, error: fetchError } = await supabase
                .from('daily_records')
                .select('id')
                .eq('user_id', user.id)
                .eq('record_date', dateStr)
                .single();

            let dailyRecordId: string;

            if (existingRecord) {
                dailyRecordId = existingRecord.id;
                // Delete existing accounts and FDs for this daily record to prevent duplicates
                await supabase.from('fixed_deposits').delete().eq('user_id', user.id).in('account_id', newRecord.accounts.map(acc => acc.id));
                await supabase.from('accounts').delete().eq('user_id', user.id).eq('daily_record_id', dailyRecordId);
            } else {
                // Insert new daily record
                const { data: insertedRecord, error: insertRecordError } = await supabase
                    .from('daily_records')
                    .insert({ user_id: user.id, record_date: dateStr })
                    .select('id')
                    .single();

                if (insertRecordError) throw insertRecordError;
                dailyRecordId = insertedRecord.id;
            }

            // Insert accounts and FDs
            for (const account of newRecord.accounts) {
                const { data: insertedAccount, error: insertAccountError } = await supabase
                    .from('accounts')
                    .insert({
                        daily_record_id: dailyRecordId,
                        user_id: user.id,
                        holder_name: account.holderName,
                        bank_name: account.bankName,
                        account_number: account.accountNumber,
                        balance: account.balance,
                    })
                    .select('id')
                    .single();

                if (insertAccountError) throw insertAccountError;

                if (account.fds && account.fds.length > 0) {
                    const fdsToInsert = account.fds.map(fd => ({
                        account_id: insertedAccount.id,
                        user_id: user.id,
                        principal: fd.principal,
                        maturity_date: fd.maturityDate,
                    }));
                    const { error: insertFdsError } = await supabase
                        .from('fixed_deposits')
                        .insert(fdsToInsert);

                    if (insertFdsError) throw insertFdsError;
                }
            }

            // Re-fetch data to update state
            await fetchDailyRecords();

        } catch (error) {
            console.error("Error saving data:", error);
        }
    }, [user, fetchDailyRecords]);

    const getLatestRecord = useCallback(async (beforeDate: Date | undefined) => {
        if (!user || !beforeDate || !isValid(beforeDate)) return null;

        const dateStr = format(beforeDate, 'yyyy-MM-dd');

        try {
            const { data: record, error } = await supabase
                .from('daily_records')
                .select(`
                    id,
                    record_date,
                    accounts (
                        id,
                        holder_name,
                        bank_name,
                        account_number,
                        balance,
                        fixed_deposits (
                            id,
                            principal,
                            maturity_date
                        )
                    )
                `)
                .eq('user_id', user.id)
                .lt('record_date', dateStr) // Get records before the specified date
                .order('record_date', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
                throw error;
            }

            if (!record) return null;

            return {
                date: format(parseISO(record.record_date), 'yyyy-MM-dd'),
                accounts: record.accounts.map((acc: any) => ({
                    id: acc.id,
                    holderName: acc.holder_name,
                    bankName: acc.bank_name,
                    accountNumber: acc.account_number,
                    balance: acc.balance,
                    fds: acc.fixed_deposits.map((fd: any) => ({
                        id: fd.id,
                        principal: fd.principal,
                        maturityDate: format(parseISO(fd.maturity_date), 'yyyy-MM-dd'),
                    }))
                }))
            };

        } catch (error) {
            console.error("Error fetching latest record:", error);
            return null;
        }
    }, [user]);

    const getLatestDateWithData = useCallback(() => {
        const dateStrings = Object.keys(data);
        if (dateStrings.length === 0) {
            return null;
        }
        dateStrings.sort((a, b) => b.localeCompare(a));
        return parseISO(dateStrings[0]);
    }, [data]);

    const importData = useCallback(async (newData: Record<string, DailyRecord>) => {
        if (!user) {
            console.error("User not authenticated. Cannot import data.");
            return false;
        }

        try {
            // Delete all existing data for the user first
            await supabase.from('fixed_deposits').delete().eq('user_id', user.id);
            await supabase.from('accounts').delete().eq('user_id', user.id);
            await supabase.from('daily_records').delete().eq('user_id', user.id);

            for (const dateStr in newData) {
                const record = newData[dateStr];
                const { data: insertedRecord, error: insertRecordError } = await supabase
                    .from('daily_records')
                    .insert({ user_id: user.id, record_date: record.date })
                    .select('id')
                    .single();

                if (insertRecordError) throw insertRecordError;
                const dailyRecordId = insertedRecord.id;

                for (const account of record.accounts) {
                    const { data: insertedAccount, error: insertAccountError } = await supabase
                        .from('accounts')
                        .insert({
                            daily_record_id: dailyRecordId,
                            user_id: user.id,
                            holder_name: account.holderName,
                            bank_name: account.bankName,
                            account_number: account.accountNumber,
                            balance: account.balance,
                        })
                        .select('id')
                        .single();

                    if (insertAccountError) throw insertAccountError;

                    if (account.fds && account.fds.length > 0) {
                        const fdsToInsert = account.fds.map(fd => ({
                            account_id: insertedAccount.id,
                            user_id: user.id,
                            principal: fd.principal,
                            maturity_date: fd.maturityDate,
                        }));
                        const { error: insertFdsError } = await supabase
                            .from('fixed_deposits')
                            .insert(fdsToInsert);

                        if (insertFdsError) throw insertFdsError;
                    }
                }
            }
            await fetchDailyRecords();
            return true;
        } catch (error) {
            console.error("Failed to import data:", error);
            return false;
        }
    }, [user, fetchDailyRecords]);

    return { data, loading: loading || authLoading, getLatestRecord, saveData, importData, getLatestDateWithData };
}
