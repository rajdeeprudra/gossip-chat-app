import { useContext } from "react";
import RegisterAndLoginForm from "./RegisterAndLoginForm";
import { UserContext } from "./UserContext";
import Chat from "./chat";

export default function Routes(){
    const {username, id} = useContext(UserContext);

    if(username){
        return <Chat />;
    }



    return(
        <RegisterAndLoginForm/>
    );
}
