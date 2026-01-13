import BuildUploadDropzone from "./BuildUploadDropzone";

const SidebarUploadDropzone = ({
  onUpload,
}: {
  onUpload: (file: File, onProgress?: (progress: number) => void) => Promise<void>;
}) => {
  return <BuildUploadDropzone onUpload={onUpload} variant="compact" />;
};

export default SidebarUploadDropzone;
