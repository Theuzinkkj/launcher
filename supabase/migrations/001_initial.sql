-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  age INTEGER,
  sex TEXT CHECK (sex IN ('masculino', 'feminino', 'outro')),
  height DECIMAL(5,2),
  weight DECIMAL(5,2),
  goal TEXT CHECK (goal IN ('emagrecimento', 'hipertrofia', 'manutencao', 'performance')),
  experience_level TEXT CHECK (experience_level IN ('iniciante', 'intermediario', 'avancado')),
  available_days TEXT[] DEFAULT '{}',
  food_restrictions TEXT[] DEFAULT '{}',
  daily_calorie_goal INTEGER DEFAULT 2000,
  daily_protein_goal DECIMAL(6,2) DEFAULT 150,
  daily_carb_goal DECIMAL(6,2) DEFAULT 250,
  daily_fat_goal DECIMAL(6,2) DEFAULT 65,
  daily_water_goal DECIMAL(5,2) DEFAULT 2.5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workouts table
CREATE TABLE workouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  muscle_groups TEXT[] DEFAULT '{}',
  type TEXT CHECK (type IN ('A', 'B', 'C', 'D', 'E', 'fullbody', 'hiit', 'cardio', 'personalizado')) DEFAULT 'personalizado',
  estimated_duration INTEGER,
  is_template BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises table
CREATE TABLE exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  muscle_group TEXT,
  sets INTEGER DEFAULT 3,
  reps TEXT DEFAULT '10',
  weight DECIMAL(6,2),
  rest_seconds INTEGER DEFAULT 60,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout logs table
CREATE TABLE workout_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
  workout_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER,
  notes TEXT,
  completed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise logs table
CREATE TABLE exercise_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  muscle_group TEXT,
  sets_completed INTEGER,
  reps_completed TEXT,
  weight DECIMAL(6,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personal records table
CREATE TABLE personal_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  weight DECIMAL(6,2),
  reps INTEGER,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meals table
CREATE TABLE meals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('cafe_da_manha', 'almoco', 'jantar', 'lanche', 'pre_treino', 'pos_treino')) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_calories DECIMAL(8,2) DEFAULT 0,
  total_protein DECIMAL(8,2) DEFAULT 0,
  total_carbs DECIMAL(8,2) DEFAULT 0,
  total_fat DECIMAL(8,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food items table
CREATE TABLE food_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity DECIMAL(8,2) NOT NULL,
  unit TEXT DEFAULT 'g',
  calories DECIMAL(8,2) DEFAULT 0,
  protein DECIMAL(8,2) DEFAULT 0,
  carbs DECIMAL(8,2) DEFAULT 0,
  fat DECIMAL(8,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Water logs table
CREATE TABLE water_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml INTEGER NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Body measurements table
CREATE TABLE body_measurements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight DECIMAL(5,2),
  body_fat_percentage DECIMAL(5,2),
  chest DECIMAL(5,2),
  waist DECIMAL(5,2),
  hips DECIMAL(5,2),
  left_arm DECIMAL(5,2),
  right_arm DECIMAL(5,2),
  left_thigh DECIMAL(5,2),
  right_thigh DECIMAL(5,2),
  left_calf DECIMAL(5,2),
  right_calf DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI conversations table
CREATE TABLE ai_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI messages table
CREATE TABLE ai_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can CRUD own workouts" ON workouts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own exercises" ON exercises FOR ALL USING (
  auth.uid() = (SELECT user_id FROM workouts WHERE id = workout_id)
);
CREATE POLICY "Users can CRUD own workout_logs" ON workout_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own exercise_logs" ON exercise_logs FOR ALL USING (
  auth.uid() = (SELECT user_id FROM workout_logs WHERE id = workout_log_id)
);
CREATE POLICY "Users can CRUD own personal_records" ON personal_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own meals" ON meals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own food_items" ON food_items FOR ALL USING (
  auth.uid() = (SELECT user_id FROM meals WHERE id = meal_id)
);
CREATE POLICY "Users can CRUD own water_logs" ON water_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own body_measurements" ON body_measurements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own ai_conversations" ON ai_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own ai_messages" ON ai_messages FOR ALL USING (
  auth.uid() = (SELECT user_id FROM ai_conversations WHERE id = conversation_id)
);

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for performance
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX idx_workout_logs_date ON workout_logs(date);
CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_meals_date ON meals(date);
CREATE INDEX idx_water_logs_user_id ON water_logs(user_id);
CREATE INDEX idx_water_logs_date ON water_logs(date);
CREATE INDEX idx_body_measurements_user_id ON body_measurements(user_id);
CREATE INDEX idx_body_measurements_date ON body_measurements(date);
CREATE INDEX idx_personal_records_user_id ON personal_records(user_id);
