export default function Avatar({userId, username}){
    return (
            <div className="w-12 h-12 bg-purple-300 rounded-full  flex items-center">
             <div className="text-center w-full"> {username[0]}</div>  
            </div>
    );
}