import React, { useContext, useEffect, useRef, useState } from "react";
import styles from "./DoctorProfile.module.css";
import { UserContext } from "../Context";
import authServiceInstance from "../service/APIService";
import authServicehelpers from "../service/AuthServiceHelpers";
import defaultImage from "../assets/user.png";
import APIService from "../service/APIService";
import AuthWrapper from "../service/AuthWrapper";
import Inquiry from "../Inquiry";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun } from "docx";

export default function DoctorProfile() {
  const { isLogin } = useContext(UserContext);
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [addDeleteAppointmentMode, setAddDeleteAppointmentMode] =
    useState(false);
  const [doctorsList, setDoctorsList] = useState([]);
  const [patientsList, setPatientsList] = useState([]);
  const [userType, setUserType] = useState("");
  const [selectedTab, setSelectedTab] = useState("");
  const [answerMode, setAnswerMode] = useState(false);
  const [popupContent, setPopupContent] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const defaultState = {
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    city: "",
    country: "",
    street: "",
    birthDay: "",
    newPatient: "",
    doctorText: "",
    patientText: "",
    newAppointmentDate: "",
    newAppointmentTime: "",
    answerText: "",
    selectedDoctorForMessage: "",
    selectedPatientForMessage: "",
    selectedPatientForAppointment: "",
    description: "",
    descriptionError: "",
    newAppointmentTimeError: "",
    newAppointmentDateError: "",
    selectedDoctorForMessageError: "",
    selectedPatientForMessageError: "",
    selectedPatientForAppointmentError: "",
    idError: "",
    firstNameError: "",
    lastNameError: "",
    newPatientError: "",
    emailError: "",
    cityError: "",
    countryError: "",
    streetError: "",
    birthDayError: "",
    doctorTextError: "",
    patientsTextError: "",
    hospitalError: "",
    specializationError: "",
    answerTextError: "",
    hmoError: "",
    experienceError: "",
    specialization: "",
    hospital: "",
    hmo: "",
    experience: "",
  };

  const buildUpdatedDoctor = (user) => {
    const newUser = {
      id: user.id,
      firstName: state.firstName || user.firstName,
      lastName: state.lastName || user.lastName,
      email: user.email,
      password: user.password,
      city: state.city || user.city,
      country: state.country || user.country,
      street: state.street || user.street,
      birthDay: state.birthDay || user.birthDay,
      imageData: state.imageData || user.imageData,
      specialization: state.specialization || user.specialization,
      hospital: state.hospital || user.hospital,
      hmo: state.hmo || user.hmo,
      experience: state.experience || user.experience,
      inquiriesList: user.inquiriesList,
      patients: user.patients,
      appointments: user.appointments,
    };

    return newUser; // Ensure you return the newUser object
  };

  const [state, setState] = useState(defaultState);

  const handleInputChange = (event, fieldName) => {
    const { value } = event.target;
    console.log(fieldName, ":  ", value);
    setState((prevState) => ({
      ...prevState,
      [fieldName]: value,
      [`${fieldName}Error`]: "",
    }));
  };

  const handleSendClick = async (inquiry) => {
    const description = state.answerText;
    const inquiryId = inquiry.id;

    if (inquiryId && description) {
      try {
        const response = await APIService.sendAnswer(inquiryId, description);

        if (response) {
          console.log("Inquiry has been answered successfully: ", response);
          window.location.reload();
        } else {
          console.error("Empty response or missing data in the response.");
        }
      } catch (error) {
        console.error("Error answering inquiry:", error);
      }
    } else {
      console.error("Please provide a description.");
    }
  };

  const handleSendToAI = async (inquiry, patient) => {
    console.log("Sending to AI:");
    const inquiryId = inquiry.id;

    if (inquiryId) {
      try {
        const response = await APIService.getAIAnswer(inquiryId);
        if (response) {
          console.log(
            "Inquiry has been answered successfully by AI: ",
            response
          );
          const matchingRow = response.matching_row;
          const rowNumber = response.row_number;

          let confidenceText;
          let mainDisease = response.mainDisease;
          let otherDiseases = [];

          if (rowNumber >= 0) {
            switch (rowNumber) {
              case 1:
                confidenceText = "HIGH confidence";
                break;
              case 2:
                confidenceText = "MID confidence";
                break;
              case 3:
                confidenceText = "LOW confidence";
                break;
              default:
                confidenceText = "Unknown confidence";
            }
            mainDisease = matchingRow[`Disease ${rowNumber}`];

            otherDiseases = Object.keys(matchingRow)
              .filter(
                (key) =>
                  key.startsWith("Disease") && key !== `Disease ${rowNumber}`
              )
              .map((key) => matchingRow[key]);
          }

          const content = `Diagnosis Report for ${
            patient.firstName
          }\n\nDisease: ${mainDisease}\nConfidence: ${confidenceText}\nAI is recommending you also to check these diseases:\n- ${otherDiseases.join(
            "\n- "
          )}`;

          const handleDownload = () => {
            const fileName = `${patient.firstName}_${patient.lastName}_diagnosis_report.txt`;
            const downloadContent = `Disease: ${mainDisease}\nConfidence: ${confidenceText}\n\nAI is recommending you also to check these diseases:\n${otherDiseases.join(
              "\n"
            )}`;
            const blob = new Blob([downloadContent], {
              type: "text/plain;charset=utf-8",
            });
            saveAs(blob, fileName);
          };

          const formattedContent = (
            <div>
              <button onClick={() => setIsOpen(false)}>Close</button>{" "}
              <p>Disease: {mainDisease}</p>
              {rowNumber >= 0 && (
                <>
                  <p>Confidence: {confidenceText}</p>
                  <p>AI is recommending you also to check these diseases:</p>
                  <ul>
                    {otherDiseases.map((disease, index) => (
                      <li key={index}>{disease}</li>
                    ))}
                  </ul>
                  <button onClick={handleDownload}>Download as Text</button>
                </>
              )}
            </div>
          );

          setPopupContent(formattedContent);
          setIsOpen(true);
        } else {
          console.error("Response does not contain matching data");
        }
      } catch (error) {
        console.error("Error answering inquiry by AI:", error);
      }
    } else {
      console.error("Please provide inquiry.");
    }
  };

  const handleDoctorMessage = async () => {
    const selectedDoctor = state.selectedDoctorForMessage;
    const description = state.doctorText;
    if (selectedDoctor && description) {
      const selectedDoctor = doctorsList.find(
        (doctor) =>
          `${doctor.firstName} ${doctor.lastName}` ===
          state.selectedDoctorForMessage
      );
      try {
        const response = await APIService.addInquiryFromDoctorToDoctor(
          user,
          selectedDoctor,
          description
        );
        console.log(
          "Inquiry added successfully from doctor to doctor:",
          response
        );
        window.location.reload();
      } catch (error) {
        console.error("Error adding inquiry from doctor to doctor:", error);
      }
    } else {
      console.error("Please select a doctor and provide a description.");
    }
  };
  const handlePatientMessage = async () => {
    const selectedPatient = state.selectedPatientForMessage;
    const description = state.patientText;
    if (selectedPatient && description) {
      const selectedPatient = patientsList.find(
        (patient) =>
          `${patient.firstName} ${patient.lastName}` ===
          state.selectedPatientForMessage
      );
      try {
        const response = await APIService.addInquiryFromDoctorToPatient(
          user,
          selectedPatient,
          description
        );
        console.log(
          "Inquiry added successfully from doctor to patient:",
          response
        );
        window.location.reload();
      } catch (error) {
        console.error("Error adding inquiry from doctor to patient:", error);
      }
    } else {
      console.error("Please select a patient and provide a description.");
    }
  };

  const updateDoctor = async () => {
    const updateDoctor = buildUpdatedDoctor(user);
    try {
      const response = await APIService.updateDoctorDetails(updateDoctor);
      console.log("Doctor details updated successfully:", response);
      setUser(response.data);
      window.location.reload();
    } catch (error) {
      console.error("Error updating doctor details:", error);
    }
  };

  const handleAddPatient = async () => {
    if (state.newPatient !== "") {
      const selectedPatient = patientsList.find(
        (patient) =>
          `${patient.firstName} ${patient.lastName}` === state.newPatient
      );
      const isPatientAlreadyAdded = user.patients.some(
        (patient) => patient.id === selectedPatient.id
      );

      if (!isPatientAlreadyAdded) {
        try {
          const response = await APIService.addPatientToDoctor(
            user.id,
            selectedPatient
          );
          setState((prevState) => ({
            ...prevState,
            newPatient: "",
          }));
          window.location.reload();
        } catch (error) {
          console.error("Error adding patient to doctor:", error);
        }
      } else {
        console.log("Patient is already added to the doctors's list.");
      }
    }
  };

  const fileInputRef = useRef(null);

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("image", file);
      try {
        const response = await APIService.uploadImageForDoctor(user, formData);
        console.log("Image uploaded successfully:", response);
        window.location.reload();
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }
  };

  useEffect(() => {
    async function getUser() {
      if (isLogin) {
        try {
          const userStorage = authServicehelpers.getCurrentUser();
          let response;
          if (userStorage.roles[0] === "ROLE_PATIENT") {
            response = await authServiceInstance.getPatientByEmail(
              userStorage.sub
            );
            setUserType("Patient");
          } else if (userStorage.roles[0] === "ROLE_DOCTOR") {
            response = await authServiceInstance.getDoctorByEmail(
              userStorage.sub
            );
            setUserType("Doctor");
          }
          if (response && userStorage.roles[0] === "ROLE_DOCTOR") {
            const user = response.data;
            setUser(user);
            const updatedState = Object.keys(user).reduce((acc, key) => {
              if (user[key]) {
                acc[key] = user[key];
              }
              return acc;
            }, {});

            setState(updatedState);
          } else {
            console.error("Error in recieved response for user data");
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

  useEffect(() => {
    console.log("Updated state:", state);
  }, [state]);

  const handleDeleteAppointment = async (appointmentID) => {
    try {
      const response = await APIService.deleteDoctorAppointment(appointmentID);
      console.log("Doctor appointment deleted successfully:", response);
      window.location.reload();
    } catch (error) {
      console.error("Error deleting doctor appointment:", error);
    }
  };

  const handleAddDeleteAppointment = async (event) => {
    if (state.selectedPatientForAppointment !== "") {
      const selectedPatient = patientsList.find(
        (patient) =>
          `${patient.firstName} ${patient.lastName}` ===
          state.selectedPatientForAppointment
      );
      const date = state.newAppointmentDate + " " + state.newAppointmentTime;
      try {
        const response = await APIService.addAppointmentToDoctor(
          user,
          selectedPatient,
          date
        );
        console.log("Doctor appointment added successfully:", response);
        window.location.reload();
      } catch (error) {
        console.error("Error adding patient appointment:", error);
      }
    }
    setUser((prevUser) => ({
      ...prevUser,
      newAppointmentDate: "",
      newAppointmentTime: "",
    }));
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
      <AuthWrapper>
        <div className={styles.right}>
          <div className={styles.title}>
            <div className={styles.profile}>
              <div className={styles.image}>
                <img
                  src={
                    user && user.imageData
                      ? `data:image/jpeg;base64,${user.imageData}`
                      : defaultImage
                  }
                  alt="User"
                  className={styles.profileImage}
                />
              </div>
              <div className={styles.name}>
                {user?.firstName ?? ""} {user?.lastName ?? ""}
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
              ref={fileInputRef}
            />

            <button
              onClick={() => fileInputRef.current.click()} // Click the hidden input element when the button is clicked
              style={{
                width: "150px",
                marginLeft: "20px",
                marginTop: "-30px",
                marginBottom: "20px",
              }}
            >
              Change Image
            </button>
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
                  name="firstName"
                  placeholder={user.firstName}
                  value={state.firstName}
                  onChange={(event) => handleInputChange(event, "firstName")}
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
                  name="lastName"
                  placeholder={user.lastName}
                  value={state.lastName}
                  onChange={(event) => handleInputChange(event, "lastName")}
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
                  name="city"
                  placeholder={user.city}
                  value={state.city}
                  onChange={(event) => handleInputChange(event, "city")}
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
                  name="country"
                  placeholder={user.country}
                  value={state.country}
                  onChange={(event) => handleInputChange(event, "country")}
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
                  id={`floatingStreet`}
                  name="street"
                  placeholder={user.street}
                  value={state.street}
                  onChange={(event) => handleInputChange(event, "street")}
                />
              ) : (
                <span>{user?.street ?? ""}</span>
              )}
            </p>
            <p>
              <span className={styles.label}>Birth Date:</span>{" "}
              {editMode ? (
                <input
                  type="date"
                  className={`form-control ${styles.input} ${
                    state.birthDayError ? styles.invalid : ""
                  }`}
                  name="birthDay"
                  placeholder={user.birthDay}
                  value={state.birthDay}
                  onChange={(event) => handleInputChange(event, "birthDay")}
                />
              ) : (
                <span>{user?.birthDay ?? ""}</span>
              )}
            </p>
            <p>
              <span className={styles.label}>Specialization:</span>{" "}
              {editMode ? (
                <input
                  type="text"
                  className={`form-control ${styles.input} ${
                    state.specializationError ? styles.invalid : ""
                  }`}
                  name="specialization"
                  placeholder={user.specialization}
                  value={state.specialization}
                  onChange={(event) =>
                    handleInputChange(event, "specialization")
                  }
                />
              ) : (
                <span>{user?.specialization ?? ""}</span>
              )}
            </p>
            <p>
              <span className={styles.label}>Hospital:</span>{" "}
              {editMode ? (
                <input
                  type="text"
                  className={`form-control ${styles.input} ${
                    state.hospitalError ? styles.invalid : ""
                  }`}
                  name="hospital"
                  placeholder={user.hospital}
                  value={state.hospital}
                  onChange={(event) => handleInputChange(event, "hospital")}
                />
              ) : (
                <span>{user?.hospital ?? ""}</span>
              )}
            </p>
            <p>
              <span className={styles.label}>HMO:</span>{" "}
              {editMode ? (
                <input
                  type="text"
                  className={`form-control ${styles.input} ${
                    state.hmoError ? styles.invalid : ""
                  }`}
                  name="hmo"
                  placeholder={user.hmo}
                  value={state.hmo}
                  onChange={(event) => handleInputChange(event, "hmo")}
                />
              ) : (
                <span>{user?.hmo ?? ""}</span>
              )}
            </p>
            <p>
              <span className={styles.label}>experience:</span>{" "}
              {editMode ? (
                <input
                  type="text"
                  className={`form-control ${styles.input} ${
                    state.experienceError ? styles.invalid : ""
                  }`}
                  name="experience"
                  placeholder={user.experience}
                  value={state.experience}
                  onChange={(event) => handleInputChange(event, "experience")}
                />
              ) : (
                <span>{user?.experience ?? ""} Years</span>
              )}
            </p>
            <button
              onClick={() => {
                if (editMode) {
                  updateDoctor();
                }
                setEditMode((prevEditMode) => !prevEditMode);
              }}
            >
              {editMode ? "Save" : "Edit"}
            </button>
          </div>
        </div>
        <div className={styles.description}>
          <div className={styles.miniNavbar}>
            <div className={styles.buttonContainer}>
              <button onClick={() => setSelectedTab("messageToDoctor")}>
                Message to doctor
              </button>
              <button onClick={() => setSelectedTab("messageToPatient")}>
                Message to patient
              </button>
              <button onClick={() => setSelectedTab("inquiries")}>
                Inquiries
              </button>
              <button onClick={() => setSelectedTab("scheduleAppointment")}>
                Schedule Appointment
              </button>
              <button onClick={() => setSelectedTab("addPatient")}>
                Add Patient
              </button>
            </div>
          </div>

          {selectedTab === "messageToDoctor" && (
            <div>
              <p>You can send something to the doctor you want:</p>
              <select
                className={`form-select ${styles.input} ${
                  state.selectedDoctorForMessageError ? styles.invalid : ""
                }`}
                id="floatingSelectedDoctorForMessage"
                name="selectedDoctorForMessage"
                value={state.selectedDoctorForMessage}
                onChange={(event) =>
                  handleInputChange(event, "selectedDoctorForMessage")
                }
              >
                <option value="">Select an option</option>
                {user &&
                  doctorsList &&
                  doctorsList
                    .filter((doctor) => doctor.email !== user.email)
                    .map((doctor) => (
                      <option
                        key={doctor.email}
                        value={`${doctor.firstName} ${doctor.lastName}`}
                      >
                        To: {doctor.firstName} {doctor.lastName}
                      </option>
                    ))}
              </select>
              {renderFormField("doctorText", "Describe...", "text")}
              <button type="button" onClick={handleDoctorMessage}>
                Send
              </button>
            </div>
          )}
          {selectedTab === "messageToPatient" && (
            <div>
              <p>You can send to your patients you want a message</p>
              <p>please choose a patient and describe your message:</p>
              <select
                className={`form-select ${styles.input} ${
                  state.selectedPatientForMessage ? styles.invalid : ""
                }`}
                id="floatingSelectedPatientForMessage"
                name="selectedPatientForMessage"
                value={state.selectedPatientForMessage}
                onChange={(event) =>
                  handleInputChange(event, "selectedPatientForMessage")
                }
              >
                <option value="">Select an option</option>
                {user &&
                  user.patients &&
                  user.patients.map((patient) => (
                    <option
                      key={patient.id}
                      value={`${patient.firstName} ${patient.lastName}`}
                    >
                      To: {patient.firstName} {patient.lastName}
                    </option>
                  ))}
              </select>

              {renderFormField("patientText", "Describe here...", "text")}
              <button type="button" onClick={handlePatientMessage}>
                send
              </button>
            </div>
          )}
          {selectedTab === "inquiries" && (
            <div className={styles.inquiries}>
              <div>Here are your answered inquiries</div>
              {user?.inquiriesList?.map((inquiry, index) => {
                const patient = inquiry.hasAnswered
                  ? patientsList.find((patient) =>
                      patient.inquiriesList?.some(
                        (patientInquiry) => patientInquiry.id === inquiry.id
                      )
                    )
                  : null;
                const doctor = inquiry.hasAnswered
                  ? doctorsList.find((doctor) =>
                      doctor.inquiriesList?.some(
                        (doctorInquiry) =>
                          doctorInquiry.id === inquiry.id &&
                          doctor.email !== user.email
                      )
                    )
                  : null;
                return (
                  (doctor || patient) && (
                    <div className={styles.inquiry} key={index}>
                      <span>{`${inquiry.id}`}</span>
                      <span>
                        {patient
                          ? `-   with Patient. ${patient.firstName} ${patient.lastName}`
                          : ""}
                      </span>
                      <span>
                        {doctor
                          ? `-   with Doctor. ${doctor.firstName} ${doctor.lastName}`
                          : ""}
                      </span>
                      {inquiry.hasAnswered && (
                        <>
                          <div>message: {inquiry.symptoms}</div>
                          <div>Answer: {inquiry.answer} </div>
                        </>
                      )}
                    </div>
                  )
                );
              })}
              {user?.inquiriesList?.every(
                (inquiry) => !inquiry.hasAnswered
              ) && <p>No answered inquiries yet</p>}
              <div>Here are your unanswered inquiries</div>
              {user?.inquiriesList?.map((inquiry, index) => {
                const patient =
                  !inquiry.hasAnswered &&
                  patientsList?.find((patient) =>
                    patient.inquiriesList?.some(
                      (patientInquiry) => patientInquiry.id === inquiry.id
                    )
                  );
                const doctor =
                  !inquiry.hasAnswered &&
                  doctorsList?.find((doctor) =>
                    doctor.inquiriesList?.some(
                      (doctorInquiry) =>
                        doctorInquiry.id === inquiry.id &&
                        doctor.email !== user.email
                    )
                  );
                console.log(user.inquiriesList);
                return (
                  (doctor || patient) && (
                    <div className={styles.inquiry} key={index}>
                      <span>{`${inquiry.id}`}</span>
                      <span>
                        {patient
                          ? `-   with Patient. ${patient.firstName} ${patient.lastName}`
                          : ""}
                      </span>
                      <span>
                        {doctor
                          ? `-   with Doctor. ${doctor.firstName} ${doctor.lastName}`
                          : ""}
                      </span>
                      <p>message: {inquiry.symptoms}</p>
                      {!inquiry.hasAnswered && inquiry.senderId !== user.id && (
                        <div>
                          {answerMode &&
                            renderFormField(
                              "answerText",
                              "Answer here",
                              "text"
                            )}
                          {answerMode ? (
                            <>
                              <button onClick={() => handleSendClick(inquiry)}>
                                Send
                              </button>
                              <button
                                onClick={() => handleSendToAI(inquiry, patient)}
                              >
                                Send to AI
                              </button>
                              <Popup open={isOpen} position="right center">
                                {popupContent}
                              </Popup>
                            </>
                          ) : (
                            <button onClick={() => setAnswerMode(true)}>
                              Answer
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                );
              })}
              {user?.inquiriesList?.every((inquiry) => inquiry.hasAnswered) && (
                <p>No unanswered inquiries yet</p>
              )}
            </div>
          )}
          {selectedTab === "scheduleAppointment" && (
            <div className={styles.appointments}>
              <div>Here's your Scheduled appointments</div>
              {user?.appointments?.map((appointment, index) => {
                const patient = patientsList.find((patient) => {
                  const patientAppointments = patient.appointments || [];
                  return patientAppointments.some(
                    (patientAppointment) =>
                      patientAppointment.id === appointment.id
                  );
                });
                return (
                  <div key={index} className={styles.appointment}>
                    <span>{appointment.date ?? ""}</span>
                    <span>
                      {patient
                        ? `-   with Patient. ${patient.firstName} ${patient.lastName}`
                        : " --none"}
                    </span>
                    {addDeleteAppointmentMode && (
                      <div className={styles.appointmentsButtons}>
                        <button
                          onClick={() =>
                            handleDeleteAppointment(appointment.id)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {addDeleteAppointmentMode ? (
                <>
                  <select
                    className={`form-select ${styles.input} ${
                      state.selectedPatientForAppointmentError
                        ? styles.invalid
                        : ""
                    }`}
                    id="floatingSelectedPatientForAppointment"
                    name="selectedPatientForAppointment"
                    value={state.selectedPatientForAppointment}
                    onChange={(event) =>
                      handleInputChange(event, "selectedPatientForAppointment")
                    }
                  >
                    <option value="">Select an option</option>
                    {user &&
                      user.patients &&
                      user.patients.map((patient) => (
                        <option
                          key={patient.id}
                          value={`${patient.firstName} ${patient.lastName}`}
                        >
                          With: {patient.firstName} {patient.lastName}
                        </option>
                      ))}
                  </select>
                  <form className={styles.newAppointment}>
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
                    <button type="button" onClick={handleAddDeleteAppointment}>
                      Add
                    </button>
                    <button onClick={() => setAddDeleteAppointmentMode(false)}>
                      Done
                    </button>
                  </form>
                </>
              ) : (
                <button onClick={() => setAddDeleteAppointmentMode(true)}>
                  Add / Delete Appointment
                </button>
              )}
            </div>
          )}
          {selectedTab === "addPatient" && (
            <div className={styles.addDoctors}>
              <p>If you want To add Patients, please select Patient:</p>
              <select
                className={`form-select ${styles.input} ${
                  state.newPatient ? styles.invalid : ""
                }`}
                id="floatingNewPatient"
                name="newPatient"
                value={state["newPatient"]}
                onChange={(event) => handleInputChange(event, "newPatient")}
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
          )}
        </div>
      </AuthWrapper>
    </div>
  );
}
