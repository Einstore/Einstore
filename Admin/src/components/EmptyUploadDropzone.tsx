import BuildUploadDropzone from "./BuildUploadDropzone";

type EmptyUploadDropzoneProps = {
  onUpload: (file: File, onProgress?: (progress: number) => void) => Promise<void>;
  title?: string;
};

const EmptyUploadDropzone = ({ onUpload, title }: EmptyUploadDropzoneProps) => {
  return <BuildUploadDropzone onUpload={onUpload} title={title} variant="full" />;
};

export default EmptyUploadDropzone;
