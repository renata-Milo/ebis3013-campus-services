import { toast } from "sonner";
import type { DemoData } from "@contracts/types";
import { trpc } from "@/providers/trpc";

export function useDemoActions() {
  const utils = trpc.useUtils();
  const shared = {
    onSuccess(data: DemoData) {
      utils.demo.get.setData(undefined, data);
    },
    onError(error: { message: string }) {
      toast.error(error.message);
    },
  };

  return {
    reset: trpc.demo.reset.useMutation(shared),
    submitCleaning: trpc.demo.submitCleaning.useMutation(shared),
    assignStaff: trpc.demo.assignStaff.useMutation(shared),
    startWork: trpc.demo.startWork.useMutation(shared),
    submitForReview: trpc.demo.submitForReview.useMutation(shared),
    approveCleaning: trpc.demo.approveCleaning.useMutation(shared),
    returnForRework: trpc.demo.returnForRework.useMutation(shared),
    submitClaim: trpc.demo.submitClaim.useMutation(shared),
    decideClaim: trpc.demo.decideClaim.useMutation(shared),
    recordReturn: trpc.demo.recordReturn.useMutation(shared),
  };
}

export type DemoActions = ReturnType<typeof useDemoActions>;
