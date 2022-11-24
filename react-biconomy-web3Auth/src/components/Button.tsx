import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { CircularProgress } from "@material-ui/core";

type ButtonProp = {
  title: string;
  isLoading?: boolean;
  onClickFunc: any;
  children?: any;
  style?: any;
};

const Button: React.FC<ButtonProp> = ({
  title,
  onClickFunc,
  isLoading = false,
  children,
  style,
}) => {
  const classes = useStyles();

  return (
    <button
      onClick={onClickFunc}
      className={classes.btn}
      disabled={isLoading}
      style={style}
    >
      {isLoading ? (
        <>
          <CircularProgress
            style={{ width: 25, height: 25, marginRight: 10, color: "#fff" }}
          />{" "}
          {" Loading"}
        </>
      ) : (
        title
      )}
      {children}
    </button>
  );
};

const useStyles = makeStyles((theme: any) => ({
  btn: {
    width: "max-content",
    background: "#21325E",
    position: "relative",
    cursor: "pointer",
    borderRadius: 5,
    outline: "none",
    border: 0,
    boxShadow: "2px 2px #3E497A",
    height: 40,
    lineHeight: "36px",
    padding: "0px 12px",
    display: "flex",
    alignItems: "center",
    color: "#CDF0EA",
    transition: "0.3s",
    fontWeight: "bold",
    fontSize: 15,

    "@media (max-width:599px)": {
      padding: 0,
    },

    "&:hover": {
      // backgroundColor: "#FFC4C4",
      boxShadow: "1px 1px 0px #3E497A",
      // transform: "translate(5px, 5px)",
    },

    "& div": {
      "@media (max-width:599px)": {
        margin: 0,
        display: "none",
      },
    },
  },
}));

export default Button;
