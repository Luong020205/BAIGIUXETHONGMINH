-- 1. Tables Definition

-- Profiles: Extension of auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'employee', 'customer')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Parking Areas: Different zones for parking
CREATE TABLE IF NOT EXISTS public.parking_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('car', 'motorcycle')),
    capacity INTEGER NOT NULL DEFAULT 0,
    current_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Pricing: Rate per hour for different vehicle types
CREATE TABLE IF NOT EXISTS public.pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_type TEXT UNIQUE NOT NULL CHECK (vehicle_type IN ('car', 'motorcycle')),
    hourly_rate INTEGER NOT NULL,
    effective_from DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Parking Records: Main log of entries and exits
CREATE TABLE IF NOT EXISTS public.parking_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_plate TEXT NOT NULL,
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('car', 'motorcycle')),
    area_id UUID REFERENCES public.parking_areas(id) ON DELETE SET NULL,
    entry_time TIMESTAMPTZ DEFAULT now(),
    exit_time TIMESTAMPTZ,
    status TEXT DEFAULT 'in' CHECK (status IN ('in', 'out')),
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices: Financial records for each parking session
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID UNIQUE NOT NULL REFERENCES public.parking_records(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'online')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Vehicles: Customer-registered vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    license_plate TEXT UNIQUE NOT NULL,
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('car', 'motorcycle')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Row Level Security (RLS)

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can do everything on profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Parking Areas Policies
CREATE POLICY "Areas viewable by admin and employee" ON public.parking_areas FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'employee'))
);
CREATE POLICY "Admin can manage areas" ON public.parking_areas FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Pricing Policies
CREATE POLICY "Pricing viewable by admin and employee" ON public.pricing FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'employee'))
);
CREATE POLICY "Admin can manage pricing" ON public.pricing FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Parking Records Policies
CREATE POLICY "Records viewable by admin and employee" ON public.parking_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'employee'))
);
CREATE POLICY "Customers can view their own records" ON public.parking_records FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Admin and Employee can manage records" ON public.parking_records FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'employee'))
);

-- Invoices Policies
CREATE POLICY "Invoices viewable by admin and employee" ON public.invoices FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'employee'))
);
CREATE POLICY "Customers can view their own invoices" ON public.invoices FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.parking_records WHERE id = invoices.record_id AND customer_id = auth.uid())
);
CREATE POLICY "Admin and Employee can manage invoices" ON public.invoices FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'employee'))
);
CREATE POLICY "Customers can pay their pending invoices" ON public.invoices FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.parking_records WHERE id = invoices.record_id AND customer_id = auth.uid())
) WITH CHECK (payment_status = 'paid');

-- Vehicles Policies
CREATE POLICY "Admin and Employee can view all vehicles" ON public.vehicles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'employee'))
);
CREATE POLICY "Customers can manage their own vehicles" ON public.vehicles FOR ALL USING (customer_id = auth.uid());

-- 3. Functions and Triggers

-- Trigger to create profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.email), 'customer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to update current_count in parking_areas
CREATE OR REPLACE FUNCTION public.update_area_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.status = 'in' AND NEW.area_id IS NOT NULL) THEN
      UPDATE public.parking_areas SET current_count = current_count + 1 WHERE id = NEW.area_id;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.status = 'in' AND NEW.status = 'out' AND OLD.area_id IS NOT NULL) THEN
      UPDATE public.parking_areas SET current_count = current_count - 1 WHERE id = OLD.area_id;
    ELSIF (OLD.status = 'out' AND NEW.status = 'in' AND NEW.area_id IS NOT NULL) THEN
      UPDATE public.parking_areas SET current_count = current_count + 1 WHERE id = NEW.area_id;
    ELSIF (OLD.area_id != NEW.area_id AND NEW.status = 'in') THEN
      UPDATE public.parking_areas SET current_count = current_count - 1 WHERE id = OLD.area_id;
      UPDATE public.parking_areas SET current_count = current_count + 1 WHERE id = NEW.area_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF (OLD.status = 'in' AND OLD.area_id IS NOT NULL) THEN
      UPDATE public.parking_areas SET current_count = current_count - 1 WHERE id = OLD.area_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_record_change
  AFTER INSERT OR UPDATE OR DELETE ON public.parking_records
  FOR EACH ROW EXECUTE PROCEDURE public.update_area_count();

-- 4. Seed Data

-- Default Parking Areas
INSERT INTO public.parking_areas (code, vehicle_type, capacity) VALUES
('A1', 'car', 50),
('A2', 'car', 50),
('B1', 'motorcycle', 100),
('B2', 'motorcycle', 100);

-- Default Pricing
INSERT INTO public.pricing (vehicle_type, hourly_rate) VALUES
('car', 20000),
('motorcycle', 5000);
