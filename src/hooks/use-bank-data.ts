"use client";

import { useState, useEffect, useCallback } from 'react';
import type { DailyRecord } from '@/lib/types';
import { format, parseISO, isBefore, compareDesc, isValid } from 'date-fns';

const STORAGE_KEY = 'bankroll-data';

const getInitialData = (): Record<string, DailyRecord> => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const fd1Maturity = new Date();
    fd1Maturity.setMonth(fd1Maturity.getMonth() + 6);
    const fd2Maturity = new Date();
    fd2Maturity.setFullYear(fd2Maturity.getFullYear() + 1);

    return {
        [todayStr]: {
            date: todayStr,
            accounts: [
                {
                    id: '1',
                    holderName: 'Hari Savings',
                    bankName: 'HDFC',
                    accountNumber: '435435345',
                    balance: 340303,
                    fds: [
                        { id: 'fd1', principal: 280000, maturityDate: format(fd1Maturity, 'yyyy-MM-dd') },
                        { id: 'fd2', principal: 1250000, maturityDate: format(fd2Maturity, 'yyyy-MM-dd') },
                    ]
                },
                {
                    id: '2',
                    holderName: 'Om Savings',
                    bankName: 'SBI',
                    accountNumber: '12345678901',
                    balance: 520100,
                    fds: []
                }
            ]
        }
    };
};

export function useBankData() {
    const [data, setData] = useState<Record<string, DailyRecord>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedData = localStorage.getItem(STORAGE_KEY);
            if (storedData) {
                setData(JSON.parse(storedData));
            } else {
                const initial = getInitialData();
                setData(initial);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            // In case of error, set initial data
            setData(getInitialData());
        } finally {
            setLoading(false);
        }
    }, []);

    const saveData = useCallback((date: Date, newRecord: Omit<DailyRecord, 'date'>) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const updatedData = {
            ...data,
            [dateStr]: { ...newRecord, date: dateStr }
        };
        setData(updatedData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    }, [data]);

    const getLatestRecord = useCallback((beforeDate: Date | undefined) => {
        if (!beforeDate || !isValid(beforeDate)) return null;

        const allDates = Object.keys(data)
            .map(dateStr => parseISO(dateStr))
            .filter(d => isValid(d) && isBefore(d, beforeDate));

        if (allDates.length === 0) return null;

        allDates.sort(compareDesc);

        const latestDateStr = format(allDates[0], 'yyyy-MM-dd');
        return data[latestDateStr] || null;

    }, [data]);

    const importData = useCallback((newData: Record<string, DailyRecord>) => {
        try {
            // A more robust validation could be done here with Zod.
            // For now, just checking if it's an object.
            if (typeof newData === 'object' && newData !== null && !Array.isArray(newData)) {
                setData(newData);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
                return true;
            }
            return false;
        } catch (error) {
            console.error("Failed to import data", error);
            return false;
        }
    }, []);

    return { data, loading, getLatestRecord, saveData, importData };
}
