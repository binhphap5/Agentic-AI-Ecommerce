import React from "react";
import { Circles } from "react-loader-spinner"; // Import loader spinner
import PropTypes from "prop-types"; // Optional for type-checking

const Loader = ({ text = "Hệ thống đang xử lý..." }) => { // Default parameter for `text`
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-50 z-50">
      <div className="flex flex-col items-center">
        <Circles
          height="80"
          width="80"
          color="#FF8C00"
          ariaLabel="loading-indicator"
        />
        <p className="mt-4 text-lg font-semibold text-black">{text}</p>
      </div>
    </div>
  );
};

Loader.propTypes = {
  text: PropTypes.string,
};

export default Loader;
