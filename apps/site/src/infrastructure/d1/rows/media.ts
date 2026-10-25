/** A row of the media table. */
/** media 表的一行。 */
export interface MediaRow {
  key: string;
  kind: string;
  content_type: string;
  size: number;
  width: number | null;
  height: number | null;
  file_name: string;
  uploaded_by: string;
  created_at: string;
}
