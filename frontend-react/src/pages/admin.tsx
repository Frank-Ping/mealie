import { Outlet } from "react-router-dom";

export const handle = {
  middleware: ["auth", "admin-only"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Admin() {
  return (
    <>
  <Outlet />
    </>
  );
}
