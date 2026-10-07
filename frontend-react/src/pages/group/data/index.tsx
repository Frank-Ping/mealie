import { useNavigate } from "react-router-dom";

export default function DataPage() {
  const navigate = useNavigate();
  /* WF4-REVIEW [J] */ onMounted(() => {
    // Force redirect to first valid page
    navigate("/group/data/foods");
  });

  return (
    <>
  <div />
    </>
  );
}
