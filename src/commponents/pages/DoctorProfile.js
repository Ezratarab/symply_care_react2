import React, { useContext, useEffect, useState } from "react";
import styles from "./PatientProfile.module.css";
import { UserContext } from "../Context";
import authServiceInstance from "../service/APIService";
import authServicehelpers from "../service/AuthServiceHelpers";
import format from "date-fns/format";
import getDay from "date-fns/getDay";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-date-picker";
import APIService from "../service/APIService";

export default function DoctorProfile() {
  const { isLogin } = useContext(UserContext);
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editAppointmentMode, setEditAppointmentMode] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [addDeleteAppointmentMode, setAddDeleteAppointmentMode] =
    useState(false);


  const [patients, setPatients] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [patientsList, setPatientsList] = useState([]);

  const defaultState = {
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    city: "",
    country: "",
    street: "",
    birthDate: "",
    newPatient: "",
    newAppointmentDate: "",
    newAppointmentTime: "",
    newAppointmentTimeError: "",
    newAppointmentDateError: "",
    idError: "",
    firstNameError: "",
    lastNameError: "",
    newPatientError: "",
    emailError: "",
    cityError: "",
    countryError: "",
    streetError: "",
    birthDateError: "",
  };

  const [state, setState] = useState(defaultState);

  const handleInputChange = (event, fieldName) => {
    const { value } = event.target;
    setState((prevState) => ({
      ...prevState,
      [fieldName]: value,
      [`${fieldName}Error`]: "",
    }));
    console.log(state["newPatient"]);
    
  };
  const handleSelectChange = (event) => {
    state["newPatient"] = event.target.value;
  };
  

  const handleAddPatient = () => {
    if (state.newPatient !== "") {
      const selectedPatient = patients.find(
        (patient) =>
          `${patient.firstName} ${patient.lastName}` === state.newPatient
      );
  
      setPatients((prevPatients) => [...prevPatients, selectedPatient]);
  
      // Reset the newDoctor state after adding the doctor
      setState((prevState) => ({
        ...prevState,
        newPatient: "" // Reset newDoctor to empty string
      }));
    }
  };
  
  

  useEffect(() => {
    async function getUser() {
      if (isLogin) {
        try {
          const userStorage = authServicehelpers.getCurrentUser();
          let response;
          if (userStorage.roles[0] === "PATIENT") {
            response = await authServiceInstance.getPatientByEmail(
              userStorage.sub
            );
          } else if (userStorage.roles[0] === "DOCTOR") {
            response = await authServiceInstance.getDoctorByEmail(
              userStorage.sub
            );
          }
          if (response && userStorage.roles[0] === "DOCTOR") {
            const user = response.data;
            setUser(user);
            setPatients(user.patients);
            setState({
              id: user.id || "",
              firstName: user.firstName || "",
              lastName: user.lastName || "",
              email: user.email || "",
              city: user.city || "",
              country: user.country || "",
              street: user.street || "",
              birthDate: user.birthDate || "",
              ...defaultState,
            });
          } else {
            console.error("No response received for user data");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUser(null);
        setState(defaultState);
      }
    }
    async function fetchDoctors() {
      try {
        const response = await APIService.getAllDoctors();
        setDoctorsList(response.data);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      }
    }
    async function fetchPatients() {
      try {
        const response = await APIService.getAllPatients();
        setPatientsList(response.data);
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    }
    fetchPatients();
    fetchDoctors();
    getUser();
  }, [isLogin]);


  const handleDeleteAppointment = (index) => {
    setUser((prevUser) => {
      const updatedAppointments = [...prevUser.appointments];
      updatedAppointments.splice(index, 1); // Remove the appointment at the specified index
      return {
        ...prevUser,
        appointments: updatedAppointments,
      };
    });
  };

  const handleAddDeleteAppointment = (event) => {
    event.preventDefault();
    const date = state.newAppointmentDate + " " + state.newAppointmentTime;
    console.log(date);
    const newAppointment = { date };

    setUser((prevUser) => ({
      ...prevUser,
      appointments: [...prevUser.appointments, newAppointment],
    }));
    console.log(user.appointments);
  };

  const renderFormField = (fieldName, placeholder, type = "text") => (
    <div className={`form-floating mb-3 ${styles.formFloating}`}>
      <input
        type={type}
        className={`form-control ${styles.input} ${
          state[`${fieldName}Error`] ? styles.invalid : ""
        }`}
        id={`floating${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`}
        name={fieldName}
        placeholder={placeholder}
        value={state[fieldName] || ""}
        onChange={(event) => handleInputChange(event, fieldName)} // Modified onChange handler
      />

      <label
        htmlFor={`floating${
          fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
        }`}
      >
        {fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}
      </label>
      <span className={`text-danger ${styles.errorText}`}>
        {state[`${fieldName}Error`]}
      </span>
    </div>
  );

  return (
    <div className={styles.main}>
      <div className={styles.right}>
        <div className={styles.title}>
          <div className={styles.profile}>
            <div className={styles.image}>
              {user && user.imageData && (
                <img
                  src={`data:image/jpeg;base64,${user.imageData}`}
                  alt="User"
                  className={styles.profileImage}
                />
              )}
            </div>
            <div className={styles.name}>
              {user?.firstName ?? ""} {user?.lastName ?? ""}
            </div>
          </div>
          <h1>Have a good work!</h1>
        </div>
        <div className={styles.information}>
          <p>
            <span className={styles.label}>ID:</span>{" "}
            <span>{user?.id ?? ""}</span>
          </p>
          <p>
            <span className={styles.label}>First Name:</span>{" "}
            {editMode ? (
              <input
                type="text"
                className={`form-control ${styles.input} ${
                  state.firstNameError ? styles.invalid : ""
                }`}
                value={editMode ? state.firstName : user?.firstName ?? ""}
                name="firstName"
                onChange={handleInputChange}
              />
            ) : (
              <span>{user?.firstName ?? ""}</span>
            )}
          </p>
          <p>
            <span className={styles.label}>Last Name:</span>{" "}
            {editMode ? (
              <input
                type="text"
                className={`form-control ${styles.input} ${
                  state.lastNameError ? styles.invalid : ""
                }`}
                value={state.lastName}
                name="lastName"
                onChange={handleInputChange}
              />
            ) : (
              <span>{user?.lastName ?? ""}</span>
            )}
          </p>
          <p>
            <span className={styles.label}>email: </span>{" "}
            <span>{user?.email ?? ""}</span>
          </p>
          <p>
            <span className={styles.label}>City:</span>{" "}
            {editMode ? (
              <input
                type="text"
                className={`form-control ${styles.input} ${
                  state.cityError ? styles.invalid : ""
                }`}
                value={state.city}
                name="city"
                onChange={handleInputChange}
              />
            ) : (
              <span>{user?.city ?? ""}</span>
            )}
          </p>
          <p>
            <span className={styles.label}>Country:</span>{" "}
            {editMode ? (
              <input
                type="text"
                className={`form-control ${styles.input} ${
                  state.countryError ? styles.invalid : ""
                }`}
                value={state.country}
                name="country"
                onChange={handleInputChange}
              />
            ) : (
              <span>{user?.country ?? ""}</span>
            )}
          </p>
          <p>
            <span className={styles.label}>Street:</span>{" "}
            {editMode ? (
              <input
                type="text"
                className={`form-control ${styles.input} ${
                  state.streetError ? styles.invalid : ""
                }`}
                value={state.street}
                name="street"
                onChange={handleInputChange}
              />
            ) : (
              <span>{user?.street ?? ""}</span>
            )}
          </p>
          <p>
            <span className={styles.label}>Birth Date:</span>{" "}
            {editMode ? (
              <input
                type="text"
                className={`form-control ${styles.input} ${
                  state.birthDateError ? styles.invalid : ""
                }`}
                value={state.birthDate}
                name="birthDate"
                
              />
            ) : (
              <span>{user?.birthDate ?? ""}</span>
            )}
          </p>
          <button onClick={() => setEditMode((prevEditMode) => !prevEditMode)}>
            {editMode ? "Save" : "Edit"}
          </button>
        </div>
      </div>
      <div className={styles.description}>
        <div>
          <p>
            You can send to the doctor you want the decription of your disease
          </p>
          <p>please choose a doctor and explain your symptoms:</p>
          <select
            className={`form-select ${styles.input} ${
              state.userTypeError ? styles.invalid : ""
            }`}
            id="floatingUserType"
            name="userType"
            value={state.userType}
            
          >
            <option value="">Select an option</option>
            {user &&
              doctorsList &&
              doctorsList.map((doctor) => (
                <option
                  key={doctor.id}
                  value={`${doctor.firstName} ${doctor.lastName}`}
                >
                  To: {doctor.firstName} {doctor.lastName}
                </option>
              ))}
          </select>

          {renderFormField(
            "Description",
            "Describe what you're feeling",
            "text"
          )}
        </div>
        <div>
          <p>
            You can send to your patients you want a message
          </p>
          <p>please choose a patient and describe your message:</p>
          <select
            className={`form-select ${styles.input} ${
              state.userTypeError ? styles.invalid : ""
            }`}
            id="floatingUserType"
            name="userType"
            value={state.userType}
           
          >
            <option value="">Select an option</option>
            {user &&
              patients &&
              patients.map((patient) => (
                <option
                  key={patient.id}
                  value={`${patient.firstName} ${patient.lastName}`}
                >
                  To: {patient.firstName} {patient.lastName}
                </option>
              ))}
          </select>

          {renderFormField(
            "Description",
            "Describe what you're feeling",
            "text"
          )}
        </div>
        <div className={styles.appointments}>
          <div>Here's your Scheduled appointments</div>
          {user?.appointments?.map((appointment, index) => (
            <div key={index} className={styles.appointment}>
              <span>{appointment.date ?? ""}</span>
              {addDeleteAppointmentMode && (
                <div className={styles.appointmentsButtons}>
                  <button onClick={() => handleDeleteAppointment(index)}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}

          {addDeleteAppointmentMode ? (
            <form
              onSubmit={handleAddDeleteAppointment}
              className={styles.newAppointment}
            >
              {renderFormField(
                "newAppointmentDate",
                "Appointment Date",
                "Date"
              )}
              {renderFormField(
                "newAppointmentTime",
                "Appointment Time",
                "Time"
              )}
              <button type="submit">Add</button>
              <button onClick={() => setAddDeleteAppointmentMode(false)}>
                Done
              </button>
            </form>
          ) : (
            <button onClick={() => setAddDeleteAppointmentMode(true)}>
              Add / Delete Appointment
            </button>
          )}
        </div>
        <div className={styles.addDoctors}> 
          <p>If you want To add Patients, please select Patient:</p>
          <select
            className={`form-select ${styles.input} ${
              state.userTypeError ? styles.invalid : ""
            }`}
            id="floatingNewDoctor"
            name="newDoctor"
            value={state["newDoctor"]} onChange={handleSelectChange}
          >
            <option value="">Select a Patient</option>
            {user &&
              patientsList &&
              patientsList.map((patient) => (
                <option
                  key={patient.id}
                  value={`${patient.firstName} ${patient.lastName}`}

                >
                  {patient.firstName} {patient.lastName}
                </option>
              ))}
          </select>

          <button onClick={handleAddPatient}>Add Patient</button>
        </div>
      </div>
    </div>
  );
}
