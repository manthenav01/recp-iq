import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { processReceipt } from "@/app/actions/scan-receipt";
import { Loader2, UploadCloud, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function UploadDropzone({ onUploadComplete }: { onUploadComplete?: () => void }) {
    const { user } = useAuth();
    const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error" | "converting">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    // Helper to upload blob directly
    const uploadBlob = async (fileToUpload: File) => {
        if (!user) return;

        setStatus("uploading");
        const fileName = `${Date.now()}_${fileToUpload.name.replace(/\.[^/.]+$/, "")}.jpg`;

        try {
            // 1. Upload to Firebase Storage
            const storageRef = ref(storage, `receipts/${user.uid}/${fileName}`);
            await uploadBytes(storageRef, fileToUpload);
            const url = await getDownloadURL(storageRef);

            // 2. Process with AI
            setStatus("processing");
            const result = await processReceipt(url, user.uid);

            if (result.success) {
                setStatus("success");
                if (onUploadComplete) onUploadComplete();
            } else {
                throw new Error(result.error);
            }
        } catch (error: unknown) {
            console.error(error);
            setStatus("error");
            setErrorMessage((error as Error).message || "Something went wrong during upload");
        }
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!user) return;
        let file = acceptedFiles[0];
        if (!file) return;

        console.log("File dropped:", file.name);

        // Handle HEIC
        if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
            setStatus("converting");
            try {
                const heic2any = (await import("heic2any")).default;
                const cleanBlob = new Blob([file], { type: "image/heic" });
                const convertedBlob = await heic2any({ blob: cleanBlob, toType: "image/jpeg", quality: 0.8 });
                const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                file = new File([blob], file.name.replace(/\.heic$/i, ".jpg"), { type: "image/jpeg" });
            } catch (e: any) {
                console.error("Client-side HEIC conversion failed", e);
                // Fallback
                if (e?.code === 2 || e?.message?.includes("not supported") || e?.message?.includes("ERR_LIBHEIF")) {
                    try {
                        const formData = new FormData();
                        formData.append("file", file);
                        const res = await fetch("/api/heic-convert", { method: "POST", body: formData });
                        if (!res.ok) throw new Error("Server fail");
                        const blob = await res.blob();
                        file = new File([blob], file.name.replace(/\.heic$/i, ".jpg"), { type: "image/jpeg" });
                    } catch (serverErr) {
                        console.error("Server conversion failed", serverErr);
                        setErrorMessage("Could not process this image format.");
                        setStatus("error");
                        return;
                    }
                } else {
                    setErrorMessage("Image conversion failed.");
                    setStatus("error");
                    return;
                }
            }
        }

        // Auto-upload immediately
        uploadBlob(file);

    }, [user, onUploadComplete]); // eslint-disable-line react-hooks/exhaustive-deps

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.heic'] },
        maxFiles: 1
    });

    return (
        <div className="w-full">
            {status === "idle" || status === "error" ? (
                <div
                    {...getRootProps()}
                    className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50"}
            ${status === "error" ? "border-red-500 bg-red-50 dark:bg-red-900/20" : ""}
          `}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-2">
                        <UploadCloud className={`h-10 w-10 ${status === "error" ? "text-red-500" : "text-slate-400"}`} />
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {isDragActive ? "Drop receipt here" : "Drag & drop receipt, or click to select"}
                        </p>
                        <p className="text-xs text-slate-500">
                            Supports PNG, JPG, WEBP
                        </p>
                    </div>
                    {status === "error" && (
                        <p className="mt-4 text-sm text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
                            <AlertCircle className="h-4 w-4" /> {errorMessage}
                        </p>
                    )}
                </div>
            ) : (
                <Card className="p-8 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50 dark:bg-slate-900 border-none">
                    {status === "success" ? (
                        <>
                            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">Receipt Processed!</h3>
                                <p className="text-sm text-slate-500">Your data has been extracted successfully.</p>
                            </div>
                            <Button variant="outline" onClick={() => { setStatus("idle"); }}>
                                Scan Another
                            </Button>
                        </>
                    ) : (
                        <>
                            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                    {status === "uploading" ? "Uploading Image..." :
                                        status === "converting" ? "Optimizing Image..." :
                                            "Analyzing Receipt..."}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    {status === "uploading" ? "Please wait while we secure your file." :
                                        status === "converting" ? "Enhancing quality for better accuracy." :
                                            "Extracting items, date, and total."}
                                </p>
                            </div>
                        </>
                    )}
                </Card>
            )}
        </div>
    );
}
