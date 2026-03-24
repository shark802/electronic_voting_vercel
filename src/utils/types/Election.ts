type Election = {
	election_id: string;
	election_name: string;
	date_start: string;
	time_start: string;
	date_end: string;
	time_end: string;
	is_active: number;
	is_close: number;
	total_populations: number;
	total_voted: number;
	is_deleted: number;
	created_at: string;
};

export { Election };
