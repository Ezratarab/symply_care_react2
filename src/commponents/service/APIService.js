import React from 'react'
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
//import AuthServiceHelpers from "./AuthServiceHelpers";

const API_URL = 'http://localhost:8080';

const DOCTORS_LIST_URL = "http://localhost:8080/doctors/doctors";
const PATIENTS_LIST_URL = "http://localhost:8080/patients/patients";
const DELETE_PATIENT_URL = "http://localhost:8080/patients/deletePatient";
const GET_PATIENT_URL = "http://localhost:8080/patients/patient"



class APIService {
    
    getAllDoctors(){
        return axios.get(DOCTORS_LIST_URL);
    }

    getAllPatients(){
        return axios.get(PATIENTS_LIST_URL);
    }

    deletePatient(id){
        console.log("hi");
        return axios.delete(`${DELETE_PATIENT_URL}${id}`);
    }
    getPatient(id){
        return axios.get(`${GET_PATIENT_URL}${id}`)
    }
    login(email, password) {
        return axios
            .post(`${API_URL}/login`, {email, password})
            .then((response) => {
                if (response.data.accessToken) {
                    // Decode the token to get user details and roles
                    const decodedToken = jwtDecode(response.data.accessToken);
                    const user = {
                        accessToken: response.data.accessToken,
                        refreshToken: response.data.refreshToken,
                        roles: decodedToken.roles
                    };

                    // Save the user object to local storage
                    localStorage.setItem('user', JSON.stringify(user));
                }
                return response.data;
            });
    }

    // helper method, Get refresh token from local storage
    getRefreshToken() {
        const user = JSON.parse(localStorage.getItem('user'));
        return user ? user.refreshToken : null;
    }

    // **** Logout user, use the jwt token to invalidate the session on the server
    logout() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.accessToken && user.refreshToken) {
            // Stop token refresh
            // Clear user data from local storage
            localStorage.removeItem('user');
            // Dispatch custom event to stop token refresh
           // const event = new Event('refresh-token');
             // window.dispatchEvent(event);
            // Invalidate session on server by sending logout request
            axios.get(`${API_URL}/logout`, {
                headers: {
                    Authorization: `Bearer ${user.accessToken}`
                }
            })
                .then(response => {
                    console.log('Logged out successfully');
                })
                .catch(error => {
                    console.error('Logout error:', error);
                });
        }
    }

}
const authServiceInstance = new APIService(); // Create an instance of AuthServiceAxios
export default authServiceInstance;  // Export the instance as the default export

