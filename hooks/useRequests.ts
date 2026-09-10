import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Request, RequestCreateInput, RequestUpdateInput } from "@/types";

const getRequests = async (status?: string): Promise<Request[]> => {
  const url = status ? `/api/requests?status=${status}` : "/api/requests";
  const { data } = await axios.get(url);
  return data;
};

const getRequestById = async (id: string): Promise<Request> => {
  const { data } = await axios.get(`/api/requests/${id}`);
  return data;
};

const createRequest = async (input: RequestCreateInput) => {
  const { data } = await axios.post("/api/requests", input);
  return data;
};

const updateRequest = async ({ id, ...input }: RequestUpdateInput & { id: string }) => {
  const { data } = await axios.patch(`/api/requests/${id}`, input);
  return data;
};

const deleteRequest = async (id: string) => {
  await axios.delete(`/api/requests/${id}`);
};

export function useRequests(status?: string) {
  return useQuery({
    queryKey: ["requests", status],
    queryFn: () => getRequests(status),
  });
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: ["requests", id],
    queryFn: () => getRequestById(id),
    enabled: !!id,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}

export function useUpdateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRequest,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["requests", data.id] });
    },
  });
}

export function useDeleteRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}