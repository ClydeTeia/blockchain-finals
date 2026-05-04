  const flagAnswer = useCallback(
    async (answerId: string): Promise<boolean> => {
      setIsActing(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/answers/${answerId}/flag`, {
          method: "POST",
        });
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? "Flagging failed.");
        }
        // Note: We don't have a direct way to refetch answers here, but the admin panel might refetch on its own.
        // For now, we just return success.
        return true;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Flagging failed.";
        setError(msg);
        return false;
      } finally {
        setIsActing(false);
      }
    },
    []
  );

  const addAuditNote = useCallback(
    async (answerId: string, note: string): Promise<boolean> => {
      setIsActing(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/answers/${answerId}/audit-note`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auditNote: note }),
        });
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? "Adding audit note failed.");
        }
        return true;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Adding audit note failed.";
        setError(msg);
        return false;
      } finally {
        setIsActing(false);
      }
    },
    []
  );