import { useState } from "react";
import { Button, Fade } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";

export default function AppScrollToTop() {
  const [showButton, setShowButton] = useState(false);
  const threshold = 400;

  function onScroll() {
    setShowButton(document.documentElement.scrollTop > threshold);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* WF4-REVIEW [J] */ onMounted(() => {
    window.addEventListener("scroll", onScroll);
  });

  /* WF4-REVIEW [J] */ onUnmounted(() => {
    window.removeEventListener("scroll", onScroll);
  });

  return (
    <>
  {/* WF4-REVIEW: transition semantics */}
  <Fade in={true}>
    {(showButton) ? (
      <Button icon position="fixed" location="bottom right" className="ma-4" color="primary" elevation="4" style="z-index: 999;" onClick={scrollToTop}>
        {/* WF4-REVIEW: icon name resolves via lib/icons */}
        <MdiIcon name={icons.arrowUp} />
      </Button>
    ) : null}
  </Fade>
    </>
  );
}
