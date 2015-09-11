﻿//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated by a tool.
//     Runtime Version:4.0.30319.34014
//
//     Changes to this file may cause incorrect behavior and will be lost if
//     the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace VKeCRM.Portal.Web.PortalServices {
    
    
    [System.CodeDom.Compiler.GeneratedCodeAttribute("System.ServiceModel", "4.0.0.0")]
    [System.ServiceModel.ServiceContractAttribute(ConfigurationName="PortalServices.IPortalServices")]
    public interface IPortalServices {
        
        [System.ServiceModel.OperationContractAttribute(Action="http://tempuri.org/IPortalServices/DoWork", ReplyAction="http://tempuri.org/IPortalServices/DoWorkResponse")]
        void DoWork();
        
        [System.ServiceModel.OperationContractAttribute(Action="http://tempuri.org/IPortalServices/DoWork", ReplyAction="http://tempuri.org/IPortalServices/DoWorkResponse")]
        System.Threading.Tasks.Task DoWorkAsync();
        
        [System.ServiceModel.OperationContractAttribute(Action="http://tempuri.org/IPortalServices/GetAllOrders", ReplyAction="http://tempuri.org/IPortalServices/GetAllOrdersResponse")]
        VKeCRM.Common.Collections.VKList<VKeCRM.Portal.DataTransferObjects.Orders> GetAllOrders();
        
        [System.ServiceModel.OperationContractAttribute(Action="http://tempuri.org/IPortalServices/GetAllOrders", ReplyAction="http://tempuri.org/IPortalServices/GetAllOrdersResponse")]
        System.Threading.Tasks.Task<VKeCRM.Common.Collections.VKList<VKeCRM.Portal.DataTransferObjects.Orders>> GetAllOrdersAsync();
        
        [System.ServiceModel.OperationContractAttribute(Action="http://tempuri.org/IPortalServices/SaveOrder", ReplyAction="http://tempuri.org/IPortalServices/SaveOrderResponse")]
        VKeCRM.Portal.DataTransferObjects.Orders SaveOrder(VKeCRM.Portal.DataTransferObjects.Orders dto);
        
        [System.ServiceModel.OperationContractAttribute(Action="http://tempuri.org/IPortalServices/SaveOrder", ReplyAction="http://tempuri.org/IPortalServices/SaveOrderResponse")]
        System.Threading.Tasks.Task<VKeCRM.Portal.DataTransferObjects.Orders> SaveOrderAsync(VKeCRM.Portal.DataTransferObjects.Orders dto);
        
        [System.ServiceModel.OperationContractAttribute(Action="http://tempuri.org/IPortalServices/SaveMasterDetail", ReplyAction="http://tempuri.org/IPortalServices/SaveMasterDetailResponse")]
        VKeCRM.Portal.DataTransferObjects.Master SaveMasterDetail(VKeCRM.Portal.DataTransferObjects.Master dto);
        
        [System.ServiceModel.OperationContractAttribute(Action="http://tempuri.org/IPortalServices/SaveMasterDetail", ReplyAction="http://tempuri.org/IPortalServices/SaveMasterDetailResponse")]
        System.Threading.Tasks.Task<VKeCRM.Portal.DataTransferObjects.Master> SaveMasterDetailAsync(VKeCRM.Portal.DataTransferObjects.Master dto);
    }
    
    [System.CodeDom.Compiler.GeneratedCodeAttribute("System.ServiceModel", "4.0.0.0")]
    public interface IPortalServicesChannel : VKeCRM.Portal.Web.PortalServices.IPortalServices, System.ServiceModel.IClientChannel {
    }
    
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.CodeDom.Compiler.GeneratedCodeAttribute("System.ServiceModel", "4.0.0.0")]
    public partial class PortalServicesClient : System.ServiceModel.ClientBase<VKeCRM.Portal.Web.PortalServices.IPortalServices>, VKeCRM.Portal.Web.PortalServices.IPortalServices {
        
        public PortalServicesClient() {
        }
        
        public PortalServicesClient(string endpointConfigurationName) : 
                base(endpointConfigurationName) {
        }
        
        public PortalServicesClient(string endpointConfigurationName, string remoteAddress) : 
                base(endpointConfigurationName, remoteAddress) {
        }
        
        public PortalServicesClient(string endpointConfigurationName, System.ServiceModel.EndpointAddress remoteAddress) : 
                base(endpointConfigurationName, remoteAddress) {
        }
        
        public PortalServicesClient(System.ServiceModel.Channels.Binding binding, System.ServiceModel.EndpointAddress remoteAddress) : 
                base(binding, remoteAddress) {
        }
        
        public void DoWork() {
            base.Channel.DoWork();
        }
        
        public System.Threading.Tasks.Task DoWorkAsync() {
            return base.Channel.DoWorkAsync();
        }
        
        public VKeCRM.Common.Collections.VKList<VKeCRM.Portal.DataTransferObjects.Orders> GetAllOrders() {
            return base.Channel.GetAllOrders();
        }
        
        public System.Threading.Tasks.Task<VKeCRM.Common.Collections.VKList<VKeCRM.Portal.DataTransferObjects.Orders>> GetAllOrdersAsync() {
            return base.Channel.GetAllOrdersAsync();
        }
        
        public VKeCRM.Portal.DataTransferObjects.Orders SaveOrder(VKeCRM.Portal.DataTransferObjects.Orders dto) {
            return base.Channel.SaveOrder(dto);
        }
        
        public System.Threading.Tasks.Task<VKeCRM.Portal.DataTransferObjects.Orders> SaveOrderAsync(VKeCRM.Portal.DataTransferObjects.Orders dto) {
            return base.Channel.SaveOrderAsync(dto);
        }
        
        public VKeCRM.Portal.DataTransferObjects.Master SaveMasterDetail(VKeCRM.Portal.DataTransferObjects.Master dto) {
            return base.Channel.SaveMasterDetail(dto);
        }
        
        public System.Threading.Tasks.Task<VKeCRM.Portal.DataTransferObjects.Master> SaveMasterDetailAsync(VKeCRM.Portal.DataTransferObjects.Master dto) {
            return base.Channel.SaveMasterDetailAsync(dto);
        }
    }
}