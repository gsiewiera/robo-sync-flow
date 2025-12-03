-- Create storage bucket for robot model images
INSERT INTO storage.buckets (id, name, public)
VALUES ('robot-model-images', 'robot-model-images', true);

-- Create storage policies for robot model images
CREATE POLICY "Anyone can view robot model images"
ON storage.objects FOR SELECT
USING (bucket_id = 'robot-model-images');

CREATE POLICY "Admins can upload robot model images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'robot-model-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update robot model images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'robot-model-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete robot model images"
ON storage.objects FOR DELETE
USING (bucket_id = 'robot-model-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Add image_path column to robot_model_dictionary
ALTER TABLE public.robot_model_dictionary
ADD COLUMN image_path TEXT;