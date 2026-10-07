import { useMemo, useState } from "react";
import { icons } from "@/lib/icons";
import type { VueI18n } from "vue-i18n";
import { scorePassword } from "@/lib/validators";

export function usePasswordField() {
  const [show, setShow] = useState(false);
  // icons imported directly (was $globals)

  const passwordIcon = useMemo(() => {
    return show ? icons.eyeOff : icons.eye;
  }, []); // WF4-REVIEW: dependency array
  const inputType = useMemo(() => (show ? "text" : "password"), []); // WF4-REVIEW: dependency array

  const togglePasswordShow = () => {
    setShow(!show);
  };

  return {
    inputType,
    togglePasswordShow,
    passwordIcon,
  };
}

export const usePasswordStrength = (password: string /* WF4-REVIEW: was Ref */, i18n: VueI18n) => {
  const score = useMemo(() => scorePassword(password), []); // WF4-REVIEW: dependency array
  const strength = useMemo(() => {
    if (score < 50) {
      return i18n.t("user.password-strength-values.weak");
    }
    else if (score < 80) {
      return i18n.t("user.password-strength-values.good");
    }
    else if (score < 100) {
      return i18n.t("user.password-strength-values.strong");
    }
    else {
      return i18n.t("user.password-strength-values.very-strong");
    }
  }, []); // WF4-REVIEW: dependency array

  const color = useMemo(() => {
    if (score < 50) {
      return "error";
    }
    else if (score < 80) {
      return "warning";
    }
    else if (score < 100) {
      return "info";
    }
    else {
      return "success";
    }
  }, []); // WF4-REVIEW: dependency array

  return { score, strength, color };
};
