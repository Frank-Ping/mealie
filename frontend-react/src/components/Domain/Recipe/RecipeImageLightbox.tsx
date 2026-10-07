import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Dialog } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import { useTheme } from "vuetify";

interface Props {
  imageUrl?: string;
  imageAlt?: string;
}

export default function RecipeImageLightbox({ imageUrl, imageAlt }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature */
  const model = defineModel<boolean>({ required: true });

  const theme = useTheme();
  const isDark = theme.global.current.dark; // was computed — plain read stays reactive

  const scrimColor = useMemo(() => isDark ? "rgba(0, 0, 0, 0.75, []); // WF4-REVIEW: dependency array" : "rgba(255, 255, 255, 0.75)",
  );

  const imageShadow = useMemo(() => isDark
      ? "0 0 24px rgba(255, 255, 255, 0.45, []); // WF4-REVIEW: dependency array, 0 0 140px rgba(255, 255, 255, 0.45)"
      : "0 6px 16px rgba(0, 0, 0, 0.55), 0 18px 80px rgba(0, 0, 0, 0.7)",
  );

  // The <img> box must be sized to the actual rendered pixels of the image (not the
  // frame's bounding box) so the box-shadow/glow hugs the photo's real edges rather
  // than the invisible letterboxed area object-fit:contain would otherwise leave.
  const [frameRef, setFrameRef] = useState(null);
  const frameSize = /* WF4-REVIEW [J] */ reactive({ w: 0, h: 0 });
  const naturalSize = /* WF4-REVIEW [J] */ reactive({ w: 0, h: 0 });

  function updateFrameSize() {
    if (frameRef) {
      frameSize.w = frameRef.clientWidth;
      frameSize.h = frameRef.clientHeight;
    }
  }

  function onImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    naturalSize.w = img.naturalWidth;
    naturalSize.h = img.naturalHeight;
    updateFrameSize();
  }

  /* WF4-REVIEW [J] */ onMounted(() => {
    updateFrameSize();
    window.addEventListener("resize", updateFrameSize);
  });

  /* WF4-REVIEW [J] */ onUnmounted(() => {
    window.removeEventListener("resize", updateFrameSize);
  });

  const renderedSize = useMemo(() =>  {
    if (!naturalSize.w || !naturalSize.h || !frameSize.w || !frameSize.h, []); // WF4-REVIEW: dependency array {
      return null;
    }

    const scale = Math.min(frameSize.w / naturalSize.w, frameSize.h / naturalSize.h);
    return { width: naturalSize.w * scale, height: naturalSize.h * scale };
  });

  const ZOOM_SCALE = 2;

  const [zoomed, setZoomed] = useState(false);
  const pan = /* WF4-REVIEW [J] */ reactive({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragMoved, setDragMoved] = useState(false);
  let dragStart = { x: 0, y: 0, panX: 0, panY: 0 };

  // Keep the zoomed image overlapping its frame: at most half the overhang in each
  // direction, so it can never be dragged completely out of view.
  function applyPan(x: number, y: number) {
    const limitX = renderedSize
      ? Math.max(0, (renderedSize.width * ZOOM_SCALE - frameSize.w) / 2)
      : 0;
    const limitY = renderedSize
      ? Math.max(0, (renderedSize.height * ZOOM_SCALE - frameSize.h) / 2)
      : 0;

    pan.x = Math.min(Math.max(x, -limitX), limitX);
    pan.y = Math.min(Math.max(y, -limitY), limitY);
  }

  function resetZoom() {
    setZoomed(false);
    pan.x = 0;
    pan.y = 0;
  }

  /* WF4-REVIEW [J] */ watch(model, (open) => {
    if (!open) {
      resetZoom();
    }
  });

  function onBackgroundClick() {
    model = false;
  }

  function onImageClick(event: MouseEvent) {
    event.stopPropagation();
    if (dragMoved) {
      setDragMoved(false);
      return;
    }
    if (zoomed) {
      resetZoom();
    }
    else {
      setZoomed(true);
    }
  }

  function onPointerDown(event: PointerEvent) {
    event.stopPropagation();
    if (!zoomed) {
      return;
    }
    setDragging(true);
    setDragMoved(false);
    dragStart = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent) {
    if (!dragging) {
      return;
    }
    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      setDragMoved(true);
    }
    applyPan(dragStart.panX + dx, dragStart.panY + dy);
  }

  function onPointerUp(event: PointerEvent) {
    event.stopPropagation();
    setDragging(false);
  }

  const imgStyle = useMemo(() => ({
    ...(renderedSize
      ? { width: `${renderedSize.width}px`, height: `${renderedSize.height}px` }
      : {}, []); // WF4-REVIEW: dependency array,
    boxShadow: imageShadow,
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomed ? ZOOM_SCALE : 1})`,
    transition: dragging ? "none" : "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: zoomed ? "zoom-out" : "zoom-in",
  }));

  return (
    <>
  {/* WF4-REVIEW: max-width/scrollable */}
  <Dialog open={model} onClose={/* WF4-REVIEW: setter */ setModel} fullscreen scrim="transparent" transition="fade-transition">
    <div className="lightbox-content" style={{ backgroundColor: scrimColor }} onClick={onBackgroundClick}>
      <div ref="frameRef" className="lightbox-frame">
        {(imageUrl) ? (
          <img src={imageUrl} alt={imageAlt} className="lightbox-img" draggable="false" style={imgStyle} onLoad={onImageLoad} onClick={onImageClick} onPointerdown={onPointerDown} onPointermove={onPointerMove} onPointerup={onPointerUp} onPointercancel={onPointerUp} />
        ) : null}
      </div>
      <Button icon variant="text" className="lightbox-close" aria-label={t('general.close')} onClick={(e) => { e.stopPropagation(); model = false; }}>
        {/* WF4-REVIEW: icon name resolves via lib/icons */}
        <MdiIcon name={$globals.icons.close} />
      </Button>
    </div>
  </Dialog>
    </>
  );
}
