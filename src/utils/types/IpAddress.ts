type IpAddress = {
    id: number;
    ip_address: string;
    created_at: Date;
    deleted_at: Date | null;
}

export { IpAddress }