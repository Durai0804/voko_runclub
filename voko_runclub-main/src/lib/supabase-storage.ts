import { supabase } from "@/integrations/supabase/client";

export const uploadEventImage = async (file: File) => {
    if (!supabase) {
        throw new Error("Supabase is not configured. Please check your environment variables.");
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `event-images/${fileName}`;

    const { data, error } = await supabase.storage
        .from('event-images')
        .upload(filePath, file);

    if (error) {
        throw error;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

    return publicUrl;
};

export const uploadMultipleImages = async (files: File[]) => {
    const uploadPromises = files.map(file => uploadEventImage(file));
    return Promise.all(uploadPromises);
};
