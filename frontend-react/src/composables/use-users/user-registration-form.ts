import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAsyncValidator } from "@/composables/use-validators";
import type { VForm } from "@/types/auto-forms";
import { usePublicApi } from "@/composables/api/api-client";

const [domAccountForm, setDomAccountForm] = useState(null);
const [username, setUsername] = useState("");
const [fullName, setFullName] = useState("");
const [email, setEmail] = useState("");
const [password1, setPassword1] = useState("");
const [password2, setPassword2] = useState("");
const [advancedOptions, setAdvancedOptions] = useState(false);

export function resetUserRegistrationForm() {
  setDomAccountForm(null);
  setUsername("");
  setFullName("");
  setEmail("");
  setPassword1("");
  setPassword2("");
  setAdvancedOptions(false);
}

export const useUserRegistrationForm = () => {
  const { i18n } = useTranslation();

  async function safeValidate(form: VForm | null /* WF4-REVIEW: was Ref */) {
    if (!form) {
      return false;
    }

    const result = await form.validate();
    return result.valid;
  }
  // ================================================================
  // Provide Group Details
  const publicApi = usePublicApi();
  // ================================================================
  // Provide Account Details

  const [usernameErrorMessages, setUsernameErrorMessages] = useState([]);
  const { validate: validateUsername, valid: validUsername } = useAsyncValidator(
    username,
    (v: string) => publicApi.validators.username(v),
    i18n.t("validation.username-is-taken"),
    usernameErrorMessages,
  );
  const [emailErrorMessages, setEmailErrorMessages] = useState([]);
  const { validate: validateEmail, valid: validEmail } = useAsyncValidator(
    email,
    (v: string) => publicApi.validators.email(v),
    i18n.t("validation.email-is-taken"),
    emailErrorMessages,
  );
  const accountDetails = {
    username,
    fullName,
    email,
    advancedOptions,
    validate: async () => {
      if (!validUsername || !validEmail) {
        await Promise.all([validateUsername(), validateEmail()]);
      }

      if (!validUsername || !validEmail) {
        return false;
      }

      return await safeValidate(domAccountForm as Ref<VForm>);
    },
    reset: () => {
      accountDetails.setUsername("");
      accountDetails.setFullName("");
      accountDetails.setEmail("");
      accountDetails.setAdvancedOptions(false);
    },
  };
  // ================================================================
  // Provide Credentials
  const passwordMatch = () => setPassword1(== password2 || i18n.t("user.password-must-match"));
  const credentials = {
    password1,
    password2,
    passwordMatch,
    reset: () => {
      credentials.setPassword1("");
      credentials.setPassword2("");
    },
  };

  return {
    accountDetails,
    credentials,
    emailErrorMessages,
    usernameErrorMessages,
    // Fields
    advancedOptions,
    // Validators
    validateUsername,
    validateEmail,
    // Dom Refs
    domAccountForm,
    safeValidate,
  };
};
