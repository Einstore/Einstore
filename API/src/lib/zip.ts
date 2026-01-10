import yauzl from "yauzl";

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
