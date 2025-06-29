-- Create notifications table for Elith Pharmacy
-- Run this SQL in your Supabase SQL editor to create the notifications table

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high'
  data JSONB DEFAULT NULL, -- Additional data like product IDs, etc.
  action_url VARCHAR(500) DEFAULT NULL, -- URL to navigate to when clicked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
-- Users can see all notifications (for now, you can modify this based on your needs)
CREATE POLICY "Users can view all notifications" ON notifications
    FOR SELECT USING (true);

-- Users can insert notifications (for system-generated notifications)
CREATE POLICY "Users can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Users can update their own notifications or system notifications
CREATE POLICY "Users can update notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);

-- Users can delete their own notifications or system notifications
CREATE POLICY "Users can delete notifications" ON notifications
    FOR DELETE USING (user_id = auth.uid() OR user_id IS NULL);

-- Insert some sample notifications for testing (optional)
INSERT INTO notifications (type, title, message, priority, data) VALUES
('warning', 'Low Stock Alert', 'Sample product is running low (2 left, minimum: 5)', 'high', '{"productId": "sample-id", "currentStock": 2}'),
('error', 'Out of Stock Alert', 'Sample product is completely out of stock!', 'high', '{"productId": "sample-id", "currentStock": 0}'),
('info', 'Welcome', 'Welcome to Elith Pharmacy Management System!', 'normal', '{}');
