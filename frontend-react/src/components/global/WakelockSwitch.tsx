import { useTranslation } from "react-i18next";
import { FormControlLabel } from "@mui/material";
import { useWakeLock } from "@vueuse/core";
import { useUserExperiencePreferences } from "@/composables/use-users/preferences";

export default function WakelockSwitch() {
  const { t } = useTranslation();

  const { isSupported: wakeIsSupported, isActive, request, release } = useWakeLock();
  const userExperiencePreferences = useUserExperiencePreferences();

  function handleLock() {
    if (userExperiencePreferences.lockScreen) {
      lockScreen();
    }
    else {
      unlockScreen();
    }
  }

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const wakeLock = computed({
    get: () => userExperiencePreferences.lockScreen,
    set: () => {
      userExperiencePreferences.lockScreen = !userExperiencePreferences.lockScreen;
      handleLock();
    },
  });
  async function lockScreen() {
    if (wakeIsSupported) {
      console.debug("Wake Lock Requested");
      await request("screen");
    }
  }
  async function unlockScreen() {
    if (wakeIsSupported || isActive) {
      console.debug("Wake Lock Released");
      await release();
    }
  }
  /* WF4-REVIEW [J] */ onMounted(() => handleLock());
  /* WF4-REVIEW [J] */ onUnmounted(() => unlockScreen());

  return (
    <>
  {(wakeIsSupported) ? (
    <div className="d-print-none d-flex px-2" className={$vuetify.display.smAndDown ? 'justify-center' : 'justify-end'}>
      {/* WF4-REVIEW: control={<Switch/>} + label prop */}
      <FormControlLabel value={wakeLock} onChange={/* WF4-REVIEW: setter */ setWakeLock} color="primary" label={t('recipe.screen-awake')} />
    </div>
  ) : null}
    </>
  );
}
