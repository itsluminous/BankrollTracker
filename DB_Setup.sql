 -- Create daily_records table
 CREATE TABLE public.daily_records (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
     record_date DATE NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE (user_id, record_date)
 );

 -- Enable Row Level Security for daily_records
 ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;

 -- Policy for daily_records: Users can view their own records
 CREATE POLICY "Users can view their own daily records."
 ON public.daily_records FOR SELECT
 USING (auth.uid() = user_id);

 -- Policy for daily_records: Users can insert their own records
 CREATE POLICY "Users can insert their own daily records."
 ON public.daily_records FOR INSERT
 WITH CHECK (auth.uid() = user_id);

 -- Policy for daily_records: Users can update their own records
 CREATE POLICY "Users can update their own daily records."
 ON public.daily_records FOR UPDATE
 USING (auth.uid() = user_id);

 -- Policy for daily_records: Users can delete their own records
 CREATE POLICY "Users can delete their own daily records."
 ON public.daily_records FOR DELETE
 USING (auth.uid() = user_id);


 -- Create accounts table
 CREATE TABLE public.accounts (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     daily_record_id UUID REFERENCES public.daily_records(id) ON DELETE CASCADE NOT NULL,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Redundant but useful for RLS
     holder_name TEXT NOT NULL,
     bank_name TEXT NOT NULL,
     account_number TEXT NOT NULL,
     balance BIGINT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 );

 -- Enable Row Level Security for accounts
 ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

 -- Policy for accounts: Users can view their own accounts
 CREATE POLICY "Users can view their own accounts."
 ON public.accounts FOR SELECT
 USING (auth.uid() = user_id);

 -- Policy for accounts: Users can insert their own accounts
 CREATE POLICY "Users can insert their own accounts."
 ON public.accounts FOR INSERT
 WITH CHECK (auth.uid() = user_id);

 -- Policy for accounts: Users can update their own accounts
 CREATE POLICY "Users can update their own accounts."
 ON public.accounts FOR UPDATE
 USING (auth.uid() = user_id);

 -- Policy for accounts: Users can delete their own accounts
 CREATE POLICY "Users can delete their own accounts."
 ON public.accounts FOR DELETE
 USING (auth.uid() = user_id);


 -- Create fixed_deposits table
 CREATE TABLE public.fixed_deposits (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Redundant but useful for RLS
     principal BIGINT NOT NULL,
     maturity_date DATE NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 );

 -- Enable Row Level Security for fixed_deposits
 ALTER TABLE public.fixed_deposits ENABLE ROW LEVEL SECURITY;

 -- Policy for fixed_deposits: Users can view their own fixed deposits
 CREATE POLICY "Users can view their own fixed deposits."
 ON public.fixed_deposits FOR SELECT
 USING (auth.uid() = user_id);

 -- Policy for fixed_deposits: Users can insert their own fixed deposits."
 CREATE POLICY "Users can insert their own fixed deposits."
 ON public.fixed_deposits FOR INSERT
 WITH CHECK (auth.uid() = user_id);

 -- Policy for fixed_deposits: Users can update their own fixed deposits."
 CREATE POLICY "Users can update their own fixed deposits."
 ON public.fixed_deposits FOR UPDATE
 USING (auth.uid() = user_id);

 -- Policy for fixed_deposits: Users can delete their own fixed deposits."
 CREATE POLICY "Users can delete their own fixed deposits."
 ON public.fixed_deposits FOR DELETE
 USING (auth.uid() = user_id);