import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, CardContent, CardHeader, Chip, List, ListItem, ListItemText } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import { useAnnouncements } from "@/composables/use-announcements";
import type { Announcement } from "@/composables/use-announcements";

export default function AnnouncementDialog() {
  const { t } = useTranslation();

  const dialog = defineModel<boolean>({ default: false });

  const display = useDisplay();
  const useMobile = display.smAndDown; // was computed — plain read stays reactive
  const [navOpen, setNavOpen] = useState(false);

  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  /* WF4-REVIEW [J] */ watch(() => route.fullPath, () => { dialog = false; });

  const { newAnnouncements, allAnnouncements, setLastRead, markAllAsRead } = useAnnouncements();

  const currentAnnouncement = shallowRef<Announcement | undefined>();

  /* WF4-REVIEW [J] */ watch(dialog, () => {
    if (!dialog || currentAnnouncement) {
      return;
    }

    // Show first unread on open, or fall back to the newest
    const next = newAnnouncements.at(0) || allAnnouncements.at(-1)!;
    setCurrentAnnouncement(next);
  });

  function setCurrentAnnouncement(announcement: Announcement) {
    currentAnnouncement = announcement;
    setLastRead(announcement.key);
  }

  function nextAnnouncement() {
    // Find the first unread announcement after the current one (current is already removed from newAnnouncements)
    const next = newAnnouncements.find(a => a.key > currentAnnouncement.value!.key);
    if (next) {
      setCurrentAnnouncement(next);
    }
  }

  function isLastAnnouncement(key: string) {
    if (!newAnnouncements.length) {
      return true;
    }
    else {
      return key >= newAnnouncements.at(-1)!.key;
    }
  }

  return (
    <>
  {(currentAnnouncement) ? (
    <BaseDialog value={dialog} onChange={/* WF4-REVIEW: setter */ setDialog} title={t('announcements.announcements')} icon={$globals.icons.bullhornVariant} cancel-text={t('general.done')} width="100%" max-width="1200">
      <div className="d-flex" style={{ height: useMobile ? '100%' : '60vh', minHeight: '60vh' }}>
        <List sx={{ display: (!useMobile || navOpen) ? undefined : "none" }} nav density="compact" color="primary" className="overflow-y-auto border-e flex-shrink-0" style="width: 200px; max-height: 60vh">
          {allAnnouncements.toReversed().map(announcement => (
            /* WF4-REVIEW: @click → ListItemButton */
            <ListItem key={announcement.key} active={currentAnnouncement.key === announcement.key} rounded onClick={setCurrentAnnouncement(announcement); navOpen = false}>
              {/* WF4-REVIEW: content → primary prop */}
              <ListItemText className="text-body-2">
                {announcement.meta?.title}
              </ListItemText>
              {(announcement.date) ? (
                /* WF4-REVIEW: content → secondary prop */
                <ListItemText>
                  {$d(announcement.date)}
                </ListItemText>
              ) : null}
              {(newAnnouncements.some(a => a.key === announcement.key)) ? (
                <template>
                  {/* WF4-REVIEW: icon name resolves via lib/icons */}
                  <MdiIcon name={$globals.icons.alertCircle} size="x-small" color="info" />
                </template>
              ) : null}
            </ListItem>
          ))}
        </List>
        <div className="flex-grow-1 overflow-y-auto">
          {(useMobile) ? (
            <Button prepend-icon={navOpen ? $globals.icons.chevronLeft : $globals.icons.chevronRight} density="compact" variant="text" className="mt-2 ms-2" onClick={navOpen = !navOpen}>
              {t("announcements.all-announcements")}
            </Button>
          ) : null}
          {/* WF4-REVIEW: title text moves to the title prop */}
          <CardHeader>
            {(currentAnnouncement.date) ? (
              <Chip label large className="me-1">
                {/* WF4-REVIEW: icon name resolves via lib/icons */}
                <MdiIcon name={$globals.icons.calendar} className="me-1" />
                {$d(currentAnnouncement.date)}
              </Chip>
            ) : null}
            {currentAnnouncement.meta?.title}
          </CardHeader>
          <CardContent>
            <component is={currentAnnouncement.component} />
          </CardContent>
        </div>
      </div>
      <template>
        {(newAnnouncements.length) ? (
          <BaseButton color="success" icon={$globals.icons.textBoxCheckOutline} text={t('announcements.mark-all-as-read')} onClick={markAllAsRead} />
        ) : null}
        <BaseButton disabled={isLastAnnouncement(currentAnnouncement.key)} color="info" icon={$globals.icons.arrowRightBold} icon-right text={t('general.next')} onClick={nextAnnouncement} />
      </template>
    </BaseDialog>
  ) : null}
    </>
  );
}
