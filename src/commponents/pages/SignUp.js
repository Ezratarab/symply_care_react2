import React, { useContext, useEffect, useState } from "react";
import styles from "./SignUp.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";
import { UserContext } from "../Context";
import { useNavigate } from "react-router-dom";
import authServiceInstance from "../service/APIService";
import APIService from "../service/APIService";

const SignUp = () => {
  const defaultState = {
    id: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    city: "",
    country: "",
    street: "",
    birthDay: "",
    userType: "",
    IdError: "",
    passwordError: "",
    firstNameError: "",
    lastNameError: "",
    emailError: "",
    cityError: "",
    countryError: "",
    streetError: "",
    birthDayError: "",
    userTypeError: "",
    hospitalError: "",
    specializationError: "",
    HMOError: "",
    experienceError: "",
    specialization: "",
    hospital: "",
    HMO: "",
    experience: "",
  };
  const [specializations, setSpecializations] = useState([]);

  useEffect(() => {
    async function fetchSpecializations() {
      try {
        const response = await APIService.getSpecializations();
        const data = response.data;
        if (Array.isArray(data)) {
          setSpecializations(data);
        } else {
          console.error('Expected an array but got', data);
        }
      } catch (error) {
        console.error('Error fetching specializations:', error);
      }
    }

    fetchSpecializations();
  }, []);


  const [state, setState] = useState(defaultState);
  const navigate = useNavigate();
  const { isLogin, setIsLogin } = useContext(UserContext);

  const handleInputChange = (event) => {
    console.log(event.target);
    const target = event.target;
    const value = target.value;
    const name = target.name;
    console.log(value);
    setState({
      ...state,
      [name]: value,
    });
  };

  const buildNewDoctor = (state) => {
    const newUser = {
      id: state.id,
      firstName: state.firstName,
      lastName: state.lastName,
      email: state.email,
      password: state.password,
      city: state.city,
      country: state.country,
      street: state.street,
      birthDay: state.birthDay,
      imageData: null,
      specialization: state.specialization,
      hospital: state.hospital,
      hmo: state.HMO,
      experience: state.experience,
      inquiriesList: [],
      patients: [],
      appointments: [],
    };
    console.log(newUser);
    return newUser;
  };

  const buildNewPatient = (state) => {
    const newUser = {
      id: state.id,
      firstName: state.firstName,
      lastName: state.lastName,
      email: state.email,
      password: state.password,
      city: state.city,
      country: state.country,
      street: state.street,
      birthDay: state.birthDay,
      imageData: null,
      inquiriesList: [],
      doctors: [],
      appointments: [],
    };
    console.log(newUser);
    return newUser;
  };
  const validate = () => {
    const errors = {};

    const validationRules = {
      id: {
        required: true,
        pattern: /^\d+$/,
        errorMessage: "ID field must contain only digits",
      },
      password: { required: true },
      firstName: { required: true },
      lastName: { required: true },
      email: {
        required: true,
        pattern: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        errorMessage: "Invalid email format",
      },
      city: { required: true },
      country: { required: true },
      street: { required: true },
      birthDay: { required: true },
      userType: { required: true },
    };

    // Validate each field based on the defined rules
    Object.keys(validationRules).forEach((fieldName) => {
      const rule = validationRules[fieldName];
      const value = state[fieldName];

      if (rule.required && !value) {
        errors[`${fieldName}Error`] = `${
          fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
        } field is required`;
      } else if (rule.pattern && !rule.pattern.test(value)) {
        errors[`${fieldName}Error`] = rule.errorMessage || "Invalid format";
      }
    });

    // Update state with errors, if any
    if (Object.keys(errors).length > 0) {
      setState({ ...state, ...errors });
      return false;
    }

    return true;
  };

  function handleLoginLogout() {
    setIsLogin(!isLogin);
  }

  const submit = async (event) => {
    console.log(state);
    event.preventDefault();
    if (validate()) {
      try {
        console.warn(state);
        setState(defaultState);
        if (state.userType === "Patient") {
          await authServiceInstance.signup(
            buildNewPatient(state),
            state.userType
          );
        } else if (state.userType === "Doctor") {
          await authServiceInstance.signup(
            buildNewDoctor(state),
            state.userType
          );
        }
        console.log("SignUp successful");
        window.location.reload();
        navigate("/login");
        alert("Signup successful");
      } catch (error) {
        console.error("SignUp error:", error);
        navigate("/signup");
      }
    }
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
        onChange={handleInputChange}
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
    <div className={styles.app}>
      <div className={`container-fluid ${styles.psMd0}`}>
        <div className="row g-0">
          <div
            className={`d-none d-md-flex col-md-4 col-lg-6 ${styles.bgImage}`}
          ></div>
          <div className="col-md-8 col-lg-6">
            <div
              className={`login d-flex align-items-center py-5 ${styles.container}`}
            >
              <div className="container">
                <div className="row">
                  <div
                    className={`col-md-9 col-lg-8 mx-auto ${styles.loginForm}`}
                  >
                    <h3 className={`login-heading mb-4 ${styles.loginHeading}`}>
                      Hi nice to meet you!
                    </h3>

                    <form>
                      {renderFormField("id", "ID number")}
                      {renderFormField("firstName", "First Name")}
                      {renderFormField("lastName", "Last Name")}
                      {renderFormField("email", "name@example.com")}
                      {renderFormField("city", "City")}
                      {renderFormField("country", "Country")}
                      {renderFormField("street", "Street")}
                      {renderFormField("birthDay", "Birth Day", "date")}

                      <div
                        className={`form-floating mb-3 ${styles.formFloating}`}
                      >
                        <select
                          className={`form-select ${styles.input} ${
                            state.userTypeError ? styles.invalid : ""
                          }`}
                          id="floatingUserType"
                          name="userType"
                          value={state.userType}
                          onChange={handleInputChange}
                        >
                          <option value="">Select an option</option>
                          <option value="Doctor" key="doctor">
                            Doctor
                          </option>
                          <option value="Patient" key="patient">
                            Patient
                          </option>
                        </select>
                        <label htmlFor="floatingUserType">
                          Are you a Doctor or a Patient?
                        </label>
                        <span className={`text-danger ${styles.errorText}`}>
                          {state.userTypeError}
                        </span>
                      </div>

                      {state.userType === "Doctor" && (
                        <>
                          <div
                            className={`form-floating mb-3 ${styles.formFloating}`}
                          >
                            <select
                              value={state.specialization || ""}
                              onChange={handleInputChange}
                              id="floatingSpecialization"
                              name="specialization"
                              className={`form-control ${styles.input} ${
                                state.specializationError ? styles.invalid : ""
                              }`}
                            >
                              <option value="">
                                Select your specialization
                              </option>
                              {specializations.map((spec, index) => (
                                <option key={index} value={spec}>
                                  {spec}
                                </option>
                              ))}
                            </select>

                            <label
                              htmlFor={`floating${
                                "specialization".charAt(0).toUpperCase() +
                                "specialization".slice(1)
                              }`}
                            >
                              {"specialization".charAt(0).toUpperCase() +
                                "specialization".slice(1)}
                            </label>
                            <span className={`text-danger ${styles.errorText}`}>
                              {state[`${"specialization"}Error`]}
                            </span>
                          </div>
                          {renderFormField("hospital", "Hospital")}
                          {renderFormField("HMO", "HMO")}
                          {renderFormField("experience", "Experience")}
                        </>
                      )}

                      {renderFormField("password", "Password")}

                      <div className={`form-check mb-3 ${styles.formCheck}`}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          value=""
                          id="rememberPasswordCheck"
                        />
                        <label
                          className={`form-check-label ${styles.checkboxLabel}`}
                          htmlFor="rememberPasswordCheck"
                        >
                          Remember password
                        </label>
                      </div>

                      <div className={`d-grid ${styles.grid}`}>
                        <button
                          className={`btn btn-lg btn-primary btn-login text-uppercase fw-bold mb-2 ${styles.signUpButton}`}
                          type="button"
                          onClick={submit}
                        >
                          Sign up
                        </button>
                        <div
                          className={`text-center ${styles.alreadyHaveAccount}`}
                        >
                          <a
                            className={`small ${styles.smallLink}`}
                            href="/login"
                          >
                            Already have an account?
                          </a>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
