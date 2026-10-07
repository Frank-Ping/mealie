import { useState } from "react";
import type { RequestResponse } from "@/lib/api/types/non-generated";
import type { ValidationResponse } from "@/lib/api/types/response";
import { required, email, whitespace, url, urlOptional, minLength, maxLength } from "@/lib/validators";

export const validators = {
  required,
  email,
  whitespace,
  url,
  urlOptional,
  minLength,
  maxLength,
};

/**
   * useAsyncValidator us a factory function that returns an async function that
   * when called will validate the input against the backend database and set the
   * error messages when applicable to the ref.
   */
export const useAsyncValidator = (
  value: string /* WF4-REVIEW: was Ref */,
  validatorFunc: (v: string) => Promise<RequestResponse<ValidationResponse>>,
  validatorMessage: string,
  errorMessages: string[] /* WF4-REVIEW: was Ref */,
) => {
  const [valid, setValid] = useState(false);

  const validate = async () => {
    errorMessages = [];
    const { data } = await validatorFunc(value);

    if (!data?.valid) {
      setValid(false);
      errorMessages.push(validatorMessage);
      return;
    }

    setValid(true);
  };

  return { validate, valid };
};
