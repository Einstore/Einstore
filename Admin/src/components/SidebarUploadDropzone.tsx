import BuildUploadDropzone from "./BuildUploadDropzone";

const SidebarUploadDropzone = ({ onUpload }: { onUpload: (file: File) => Promise<void> }) => {
  return <BuildUploadDropzone onUpload={onUpload} variant="compact" />;
};

export default SidebarUploadDropzone;
