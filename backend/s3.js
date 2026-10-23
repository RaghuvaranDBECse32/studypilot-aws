import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
});

/**
 * Save student notes privately to S3.
 * @param {string} notes
 * @returns {Promise<string>} The S3 object key
 */
export async function saveNotes(notes) {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    console.warn("S3_BUCKET not set — skipping note storage");
    return null;
  }

  const key = `notes/${Date.now()}-student-notes.txt`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: notes,
      ContentType: "text/plain",
      // Private by default (bucket should have Block Public Access enabled)
    })
  );

  return key;
}
