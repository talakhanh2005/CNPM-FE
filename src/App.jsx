import { ConfigProvider } from 'antd';  
import AppRoutes from './routes/AppRoutes';

const App = () => {   
  return (              
    <ConfigProvider       
      theme={{         
        token: {           
          fontFamily: 'Roboto, sans-serif',           
          colorPrimary: '#1E7DFF',           
          borderRadius: 16,           
          controlHeight: 56,         
        },         
        components: {           
          Button: { fontWeight: 700, fontSize: 18 },         
        }       
      }}     
    >       
      
      <AppRoutes />
    </ConfigProvider>   
  ); 
};

export default App;