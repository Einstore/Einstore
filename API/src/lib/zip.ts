import yauzl from "yauzl";

const INVALID_ARCHIVE_SIGNATURE = "end of central directory record signature not found";

export const isInvalidArchiveError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes(INVALID_ARCHIVE_SIGNATURE);
};

const sleep = (durationMs: number) => new Promise((resolve) => setTimeout(resolve, durationMs));

export async function ensureZipReadable(
  filePath: string,
  { retries = 2, delayMs = 150 }: { retries?: number; delayMs?: number } = {},
): Promise<void> {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await listZipEntries(filePath);
      return;
    } catch (error) {
      if (!isInvalidArchiveError(error)) {
        throw error;
      }
      if (attempt >= retries) {
        throw error;
      }
      await sleep(delayMs);
    }
  }
}

export async function listZipEntries(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    yauzl.open(filePath, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) {
        reject(err ?? new Error("Unable to open zip file"));
        return;
      }
      const entries: string[] = [];
      zipfile.readEntry();
      zipfile.on("entry", (entry) => {
        entries.push(entry.fileName);
        zipfile.readEntry();
      });
      zipfile.on("end", () => {
        zipfile.close();
        resolve(entries);
      });
      zipfile.on("error", (error) => {
        zipfile.close();
        reject(error);
      });
    });
  });
}

export async function readZipEntries(
  filePath: string,
  wanted: Set<string>,
): Promise<Map<string, Buffer>> {
  return new Promise((resolve, reject) => {
    yauzl.open(filePath, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) {
        reject(err ?? new Error("Unable to open zip file"));
        return;
      }
      const buffers = new Map<string, Buffer>();
      const pending: Promise<void>[] = [];

      zipfile.readEntry();
      zipfile.on("entry", (entry) => {
        const name = entry.fileName;
        if (entry.fileName.endsWith("/") || !wanted.has(name)) {
          zipfile.readEntry();
          return;
        }

        const promise = new Promise<void>((resolveEntry, rejectEntry) => {
          zipfile.openReadStream(entry, (streamErr, stream) => {
            if (streamErr || !stream) {
              rejectEntry(streamErr ?? new Error("Unable to read zip entry"));
              return;
            }
            const chunks: Buffer[] = [];
            stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
            stream.on("end", () => {
              buffers.set(name, Buffer.concat(chunks));
              resolveEntry();
              zipfile.readEntry();
            });
            stream.on("error", (streamError) => {
              rejectEntry(streamError);
            });
          });
        });
        pending.push(promise);
      });

      zipfile.on("end", () => {
        Promise.all(pending)
          .then(() => {
            zipfile.close();
            resolve(buffers);
          })
          .catch((error) => {
            zipfile.close();
            reject(error);
          });
      });

      zipfile.on("error", (error) => {
        zipfile.close();
        reject(error);
      });
    });
  });
}

export async function scanZipEntries(
  filePath: string,
  shouldRead: (entryName: string) => boolean,
  onEntry: (entryName: string, buffer: Buffer) => Promise<void> | void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    yauzl.open(filePath, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) {
        reject(err ?? new Error("Unable to open zip file"));
        return;
      }

      const closeWithError = (error: unknown) => {
        zipfile.close();
        reject(error instanceof Error ? error : new Error(String(error)));
      };

      zipfile.readEntry();
      zipfile.on("entry", (entry) => {
        const name = entry.fileName;
        if (name.endsWith("/") || !shouldRead(name)) {
          zipfile.readEntry();
          return;
        }

        zipfile.openReadStream(entry, (streamErr, stream) => {
          if (streamErr || !stream) {
            closeWithError(streamErr ?? new Error("Unable to read zip entry"));
            return;
          }
          const chunks: Buffer[] = [];
          stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
          stream.on("end", async () => {
            try {
              await onEntry(name, Buffer.concat(chunks));
              zipfile.readEntry();
            } catch (error) {
              closeWithError(error);
            }
          });
          stream.on("error", (streamError) => {
            closeWithError(streamError);
          });
        });
      });

      zipfile.on("end", () => {
        zipfile.close();
        resolve();
      });
      zipfile.on("error", (error) => {
        zipfile.close();
        reject(error);
      });
    });
  });
}
