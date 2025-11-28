-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('resident', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  room_number TEXT,
  role app_role NOT NULL DEFAULT 'resident',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create request category enum
CREATE TYPE public.request_category AS ENUM ('food', 'cleanliness', 'maintenance', 'fees', 'others');

-- Create request priority enum
CREATE TYPE public.request_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create request status enum
CREATE TYPE public.request_status AS ENUM ('pending', 'in_progress', 'resolved');

-- Create requests table
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category request_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority request_priority NOT NULL DEFAULT 'medium',
  status request_status NOT NULL DEFAULT 'pending',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on requests
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Requests policies
CREATE POLICY "Users can view their own requests"
  ON public.requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests"
  ON public.requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests"
  ON public.requests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
  ON public.requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all requests"
  ON public.requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create request_comments table
CREATE TABLE public.request_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on request_comments
ALTER TABLE public.request_comments ENABLE ROW LEVEL SECURITY;

-- Request comments policies
CREATE POLICY "Users can view comments on their requests"
  ON public.request_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.requests
      WHERE requests.id = request_id
      AND (requests.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      ))
    )
  );

CREATE POLICY "Admins can create comments"
  ON public.request_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'resident')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();