import { useState } from "react";

import ActionButton from "./ActionButton";
import FileDropzone from "./FileDropzone";
import Panel from "./Panel";
import TextInput from "./TextInput";

const AddAppDialog = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <Panel className="w-full max-w-xl space-y-6">
        <div>
          <h3 className="text-2xl font-display text-ink">Add app build</h3>
          <p className="mt-2 text-sm text-ink/60">
            Upload an IPA, APK, or AAB to start ingestion.
          </p>
        </div>
        <TextInput
          id="app-upload-name"
          label="App name"
          value={name}
          onChange={setName}
          placeholder="Atlas Field"
        />
        <FileDropzone
          label="App binary"
          helper="Drop a file or browse from your machine."
          onFileSelect={setFile}
        />
        <div className="flex flex-wrap justify-end gap-3">
          <ActionButton label="Cancel" variant="outline" onClick={onClose} />
          <ActionButton
            label="Upload build"
            variant="primary"
            disabled={!file || !name.trim()}
          />
        </div>
      </Panel>
    </div>
  );
};

export default AddAppDialog;
