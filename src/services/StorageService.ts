import { supabase } from '../supabase';

export const StorageService = {
  /**
   * Uploads a file to Supabase Storage and returns the public URL.
   * @param file The file to upload
   * @param bucket The bucket name (default: 'products')
   */
  uploadFile: async (file: File, bucket: string = 'products'): Promise<string> => {
    try {
      // 1. Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      // 2. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. Get the public URL
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading file to storage:', error);
      throw error;
    }
  },

  /**
   * Deletes a file from Supabase Storage.
   * @param url The public URL of the file
   * @param bucket The bucket name (default: 'products')
   */
  deleteFile: async (url: string, bucket: string = 'products'): Promise<void> => {
    try {
      // Extract file name from URL
      const fileName = url.split('/').pop();
      if (!fileName) return;

      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting file from storage:', error);
    }
  }
};
