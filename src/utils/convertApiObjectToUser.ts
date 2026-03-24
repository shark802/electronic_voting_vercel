import { TechnopalApiObject } from "./types/TechnopalApiObject";
import { User } from "./types/User";

/**
 * -Take apiObject properties and translate it into User.
 * 
 * @param apiObject -Object return by technopal API after a successful login
 * @returns -User object with equivalent properties from apiObject
 */
export function convertApiObjectToUser(apiObject: TechnopalApiObject): Omit<User, 'password' | 'year_active' | 'created_at'> {
    let user: Omit<User, 'password' | 'year_active' | 'created_at'> = {
        id_number: apiObject.user_code,
        firstname: apiObject.first_name,
        lastname: apiObject.last_name,
        middlename: apiObject.middle_name,
        email: apiObject.email_address,
        cp_number: apiObject.cp_number,
        course: apiObject.program_code,
        year_level: apiObject.year_level,
        section: apiObject.section,
        program_description: apiObject.program_description,
        is_active: apiObject.is_active === true ? 1 : 0,
        user_group: apiObject.user_group,
    }

    return user;
}