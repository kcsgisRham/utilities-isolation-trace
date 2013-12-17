<!--
 | Copyright 2013 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 -->
<%@ WebHandler Language="C#" Class="csv" %>

using System;
using System.Web;

public class csv : IHttpHandler {

public void ProcessRequest (HttpContext context) {
    String content = "no data";
    String filename = "MyFile";
    if (context.Request["report"] != null)
    {
        try
        {
            content = context.Request["report"].ToString();
        }
        catch
        {
        }
    }
    if (context.Request["filename"] != null)
    {
        try
        {
            filename = context.Request["filename"].ToString(); //+ "_" + DateTime.Now.ToString("MMMd_HH.mm.ss");
        }
        catch
        {
        }
    }

    context.Response.ContentType = "text/csv";
    context.Response.AddHeader("Content-disposition","attachment;filename="+filename+".csv");
    context.Response.Write(content);
}

public bool IsReusable {
    get {
        return false;
    }
}

}