-- Table for user profiles, linked to Supabase Auth
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  email text,
  role text default 'student',
  department text default 'General',
  "studentId" text,
  "joinedAt" date default current_date
);

-- Table for lost and found items
create table items (
  id uuid default gen_random_uuid() primary key,
  type text not null, -- 'lost' or 'found'
  title text not null,
  description text,
  category text,
  date date,
  time text,
  location text,
  images text[],
  priority text default 'normal',
  status text default 'active',
  "reportedBy" uuid references profiles(id),
  "reporterName" text,
  "reporterEmail" text,
  "createdAt" timestamp with time zone default timezone('utc'::text, now()),
  "matchScore" integer,
  "matchedItemId" uuid
);

-- Table for claims
create table claims (
  id uuid default gen_random_uuid() primary key,
  "itemId" uuid references items(id),
  "itemTitle" text,
  "itemType" text,
  "claimantId" uuid references profiles(id),
  "claimantName" text,
  "claimantEmail" text,
  description text,
  "proofDescription" text,
  status text default 'pending',
  "submittedAt" timestamp with time zone default timezone('utc'::text, now()),
  "updatedAt" timestamp with time zone default timezone('utc'::text, now()),
  "adminNote" text
);

-- Table for notifications
create table notifications (
  id uuid default gen_random_uuid() primary key,
  "userId" uuid references profiles(id),
  title text not null,
  body text,
  type text default 'update',
  read boolean default false,
  "createdAt" timestamp with time zone default timezone('utc'::text, now()),
  "itemId" uuid references items(id)
);

-- Table for announcements
create table announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  body text,
  "createdAt" timestamp with time zone default timezone('utc'::text, now()),
  "adminName" text
);

-- Setup Row Level Security (RLS)
alter table profiles enable row level security;
alter table items enable row level security;
alter table claims enable row level security;
alter table notifications enable row level security;
alter table announcements enable row level security;

-- Create policies (Example basic policies)
create policy "Public items are viewable by everyone." on items for select using (true);
create policy "Users can insert their own items." on items for insert with check (auth.uid() = "reportedBy");
create policy "Users can update their own items." on items for update using (auth.uid() = "reportedBy");
create policy "Users can delete their own items." on items for delete using (auth.uid() = "reportedBy");

create policy "Users can view their own profile." on profiles for select using (auth.uid() = id);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile." on profiles for update using (auth.uid() = id);

create policy "Users can view their own claims." on claims for select using (auth.uid() = "claimantId");
create policy "Admins can view all claims." on claims for select using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

create policy "Users can insert claims." on claims for insert with check (auth.uid() = "claimantId");
create policy "Admins can update claims." on claims for update using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

create policy "Users can view their own notifications." on notifications for select using (auth.uid() = "userId");
create policy "Users can update their own notifications." on notifications for update using (auth.uid() = "userId");

create policy "Announcements are viewable by everyone." on announcements for select using (true);
create policy "Admins can insert announcements." on announcements for insert with check (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);
create policy "Admins can update announcements." on announcements for update using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);
create policy "Admins can delete announcements." on announcements for delete using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

create policy "Users can insert notifications." on notifications for insert with check (auth.uid() is not null);
