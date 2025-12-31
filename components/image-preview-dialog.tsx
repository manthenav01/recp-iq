import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImagePreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    imageUrl: string | null;
}

export function ImagePreviewDialog({ open, onOpenChange, imageUrl }: ImagePreviewDialogProps) {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    if (!imageUrl) return null;

    const handleZoomIn = () => {
        setScale(prev => Math.min(prev + 0.5, 5));
    };

    const handleZoomOut = () => {
        setScale(prev => {
            const next = prev - 0.5;
            return next < 1 ? 1 : next;
        });
    };

    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleClose = () => {
        onOpenChange(false);
        setTimeout(() => {
            handleReset();
        }, 300);
    };

    const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const onMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-5xl w-full h-[90vh] p-0 bg-black/95 border-none shadow-2xl overflow-hidden flex flex-col select-none">
                {/* Header / Controls */}
                <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/80 backdrop-blur-sm p-1.5 rounded-lg border border-white/10">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white hover:bg-white/20"
                            onClick={handleZoomOut}
                            disabled={scale <= 1}
                            title="Zoom Out"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-xs font-mono text-white/80 w-12 text-center">
                            {Math.round(scale * 100)}%
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white hover:bg-white/20"
                            onClick={handleZoomIn}
                            title="Zoom In"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-4 bg-white/20 mx-1" />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white hover:bg-white/20"
                            onClick={handleReset}
                            title="Reset View"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Close Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="pointer-events-auto h-9 w-9 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10"
                        onClick={handleClose}
                    >
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close</span>
                    </Button>
                </div>

                {/* Draggable Area */}
                <div
                    className={cn(
                        "flex-1 w-full relative overflow-hidden flex items-center justify-center bg-black/50 cursor-grab active:cursor-grabbing",
                        isDragging && "cursor-grabbing"
                    )}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseUp}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageUrl}
                        alt="Receipt Preview"
                        className="max-w-none transition-transform duration-75 ease-out select-none"
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            cursor: isDragging ? 'grabbing' : 'grab'
                        }}
                        draggable={false}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
