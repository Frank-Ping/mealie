import { Card, Container } from "@mui/material";
import { isSameDay } from "date-fns";

interface Props {
  day: Date;
}

export default function MealPlanDayHeader({ day }: Props) {
  ;
  /* props via destructured signature */

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  return (
    <>
  <Card border="primary s-lg opacity-100" className="rounded-sm px-2" style="z-index: 2;">
    <Container className="px-0 d-flex align-center justify-space-between" height="56px">
      <p className={`pl-2 ${isToday(day) ? 'text-primary font-weight-bold' : ''}`}>
        {$d(day, "short")}
      </p>
      <slot />
    </Container>
  </Card>
    </>
  );
}
