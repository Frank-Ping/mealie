import { useEffect, useState } from "react";
import { toastLoading, loader } from "./use-toast";
import type { AllBackups, BackupOptions } from "@/lib/api/types/admin";
import { useUserApi } from "@/composables/api";

interface ImportBackup {
  name: string;
  options: BackupOptions;
}

const [backups, setBackups] = useState({
  imports: [],
  templates: [],
});

export function resetBackups() {
  setBackups({
    imports: [],
    templates: [],
  });
}

function setBackups(newBackups: AllBackups | null) {
  if (newBackups) {
    setBackups(newBackups);
  }
}

function optionsFactory() {
  return {
    tag: "",
    templates: [],
    options: {
      recipes: true,
      settings: true,
      themes: true,
      pages: true,
      users: true,
      groups: true,
      notifications: true,
    },
  };
}

export const useBackups = function (fetch = true) {
  const api = useUserApi();

  const backupOptions = /* WF4-REVIEW [J] */ reactive(optionsFactory());
  const [deleteTarget, setDeleteTarget] = useState("");

  const [selected, setSelected] = useState({
    name: "",
    options: {
      recipes: true,
      settings: true,
      themes: true,
      groups: true,
      users: true,
      notifications: true,
    },
  });

  function getBackups() {
    const backups = useEffect(() => {
  let cancelled = false;
  void (async () => {
    try {

    }
    catch (err) {
      if (!cancelled) console.error(err); // WF4-REVIEW: surface load errors (was useAsyncData)
    }
  })();
  return () => { cancelled = true; };
}, []); // WF4-REVIEW: deps + re-run trigger — confirm against auth-ready init flow
    return backups;
  }

  async function refreshBackups() {
    const { data } = await api.backups.getAll();
    if (data) {
      setBackups(data);
    }
  }

  async function createBackup() {
    loader.info("Creating Backup...");
    const { response } = await api.backups.createOne(backupOptions);

    if (response && response.status === 201) {
      refreshBackups();
      toastLoading.open = false;
      Object.assign(backupOptions, optionsFactory());
    }
  }

  async function deleteBackup() {
    const { response } = await api.backups.deleteOne(deleteTarget);
    if (response && response.status === 200) {
      refreshBackups();
    }
  }

  async function importBackup() {
    loader.info("Import Backup...");

    if (!selected) {
      return;
    }

    const { response } = await api.backups.restoreDatabase(selected.name, selected.options);

    if (response && response.status === 200) {
      refreshBackups();
      loader.close();
    }
  }

  if (fetch) {
    refreshBackups();
  }

  return {
    getBackups,
    refreshBackups,
    deleteBackup,
    importBackup,
    createBackup,
    backups,
    backupOptions,
    deleteTarget,
    selected,
  };
};
