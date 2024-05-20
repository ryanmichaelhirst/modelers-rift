import {
  GetObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl as awsRequestPresigner } from "@aws-sdk/s3-request-presigner"

export const BUCKET_NAME = process.env.S3_BUCKET_NAME ?? ""
const accessKeyId = process.env.S3_AWS_ACCESS_KEY_ID ?? ""
const secretAccessKey = process.env.S3_AWS_SECRET_ACCESS_KEY ?? ""

const s3 = new S3Client({
  region: "us-east-1",
  useAccelerateEndpoint: true,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
})

export const uploadObject = async ({ data, key }: { data: any; key: string }) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Body: data,
    Key: key,
  })

  return await s3.send(command)
}

export const listObjects = async ({
  prefix,
  delimiter,
}: {
  prefix?: string
  delimiter?: string
}) => {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    ...(prefix && { Prefix: prefix }),
    ...(delimiter && { Delimiter: delimiter }),
  })

  return await s3.send(command)
}

export const getSignedUrl = async ({ key, expiresIn }: { key: string; expiresIn?: number }) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  return await awsRequestPresigner(s3, command, { expiresIn })
}

export const getObject = async (key: string) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  return await (
    await s3.send(command)
  ).Body
}

export const performOnAllObjects = async (
  callback: (result: ListObjectsV2CommandOutput) => Promise<void>,
  options: { prefix?: string; delimiter?: string } = {},
  next?: string,
): Promise<ListObjectsV2CommandOutput> => {
  const { prefix, delimiter } = options

  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    ...(next && { ContinuationToken: next }),
    ...(delimiter && { Delimiter: delimiter }),
    ...(prefix && { Prefix: prefix }),
  })

  const response = await s3.send(command)
  await callback(response)

  if (!response.NextContinuationToken) return response

  return await performOnAllObjects(callback, options, response.NextContinuationToken)
}
