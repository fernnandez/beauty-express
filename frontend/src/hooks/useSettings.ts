import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  settingsService,
  type UpdateSettingsDto,
} from "../services/settings.service";

export const useSettings = () => {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsService.get(),
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateSettingsDto) => settingsService.update(dto),
    onSuccess: (data) => {
      queryClient.setQueryData(["settings"], data);
    },
  });
};
