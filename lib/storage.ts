import { createClient } from '@/lib/supabase/client';

export function isStorageUrl(url: string): boolean {
  return url?.startsWith(
    process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`
      : 'https://'
  ) || false;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function uploadViaApi(
  file: File,
  bucket: string = 'documents',
  folder: string = ''
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);
  formData.append('folder', folder);

  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Upload failed');
  }
  const data = await res.json();
  return data.url;
}

export const storage = {
  async uploadFile(bucket: string, path: string, file: File | Blob): Promise<{ url: string; path: string }> {
    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
        contentType: (file as any).type || 'application/octet-stream',
      });

    if (error) throw error;
    if (!data) throw new Error('Upload failed: no data returned');

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    // Track in files table
    await supabase.from('files').insert({
      file_name: path.split('/').pop() || 'unknown',
      file_type: (file as any).type || 'application/octet-stream',
      file_size: (file as File).size,
      storage_path: data.path,
      storage_bucket: bucket,
      is_base64: false,
    });

    return { url: publicUrl, path: data.path };
  },

  async uploadBase64(bucket: string, path: string, base64Data: string): Promise<{ url: string; path: string }> {
    const supabase = createClient();

    const byteCharacters = atob(base64Data.split(',')[1] || base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    const file = new File([blob], path.split('/').pop() || 'image.png', { type: 'image/png' });

    return this.uploadFile(bucket, path, file);
  },

  async deleteFile(bucket: string, path: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;

    await supabase.from('files').delete().eq('storage_path', path);
  },

  async getFileUrl(bucket: string, path: string): Promise<string | null> {
    const supabase = createClient();
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || null;
  },

  async listFiles(bucket: string, folder?: string): Promise<string[]> {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder || '');

    if (error) throw error;
    return (data || []).map(f => f.name);
  },

  async migrateTableBase64(
    table: string,
    columns: string[],
    bucket: string = 'documents',
    batchSize: number = 10
  ): Promise<{ migrated: number; failed: number; errors: string[] }> {
    const supabase = createClient();
    let migrated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const col of columns) {
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: rows, error } = await (supabase
          .from(table) as any)
          .select(`id, ${col}, created_at`)
          .not(col, 'is', null)
          .neq(col, '')
          .like(col, 'data:%')
          .range(offset, offset + batchSize - 1);

        if (error) {
          errors.push(`Error fetching ${table}.${col}: ${error.message}`);
          break;
        }

        if (!rows || rows.length === 0) {
          hasMore = false;
          break;
        }

        for (const row of rows) {
          const url = await this.migrateBase64ToStorage(
            row[col] as string,
            bucket,
            `${table}/${col}/${row.id}-${Date.now()}.png`,
            { table, column: col, id: row.id }
          );
          if (url) migrated++;
          else failed++;
        }

        offset += batchSize;
        if (rows.length < batchSize) hasMore = false;
      }
    }

    return { migrated, failed, errors };
  },

  async migrateBase64ToStorage(
    base64Data: string,
    bucket: string,
    path: string,
    fileRef: { table: string; column: string; id: string }
  ): Promise<string | null> {
    try {
      const { url } = await this.uploadBase64(bucket, path, base64Data);
      const supabase = createClient();
      await supabase
        .from(fileRef.table)
        .update({ [fileRef.column]: url })
        .eq('id', fileRef.id);
      return url;
    } catch (error) {
      console.error(`Migration error [${fileRef.table}.${fileRef.column}]:`, error);
      return null;
    }
  },
};