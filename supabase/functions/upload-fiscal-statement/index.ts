import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-request",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Check if this is an admin request
    const isAdminRequest = req.headers.get("x-admin-request") === "true";
    const authHeader = req.headers.get("Authorization");

    let userId: string | null = null;

    if (isAdminRequest) {
      // Admin request - use service role, no user ID
      console.log("Processing admin upload request");
      // userId stays null for admin
    } else {
      // Regular user - validate JWT
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

      if (claimsError || !claimsData?.claims) {
        console.error("JWT validation failed:", claimsError);
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = claimsData.claims.sub as string;
      uploaderName = claimsData.claims.email as string || userId;
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const reportId = formData.get("reportId") as string;

    if (!file || !reportId) {
      return new Response(
        JSON.stringify({ error: "Missing file or reportId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Uploading file: ${file.name} for report: ${reportId}`);

    // Use service role client for storage operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${reportId}/${timestamp}_${sanitizedFileName}`;

    // Upload file to storage
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabaseAdmin.storage
      .from("fiscal-files")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: `Erro ao fazer upload: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("File uploaded to storage:", filePath);

    // Delete existing statement_pdf files for this report
    const { data: existingFiles } = await supabaseAdmin
      .from("fiscal_report_files")
      .select("id, file_path")
      .eq("report_id", reportId)
      .eq("file_type", "statement_pdf");

    if (existingFiles && existingFiles.length > 0) {
      console.log(`Deleting ${existingFiles.length} existing statement files`);
      
      for (const existingFile of existingFiles) {
        await supabaseAdmin.storage.from("fiscal-files").remove([existingFile.file_path]);
      }
      
      await supabaseAdmin
        .from("fiscal_report_files")
        .delete()
        .eq("report_id", reportId)
        .eq("file_type", "statement_pdf");
    }

    // Insert new file record
    const { error: insertError } = await supabaseAdmin
      .from("fiscal_report_files")
      .insert({
        report_id: reportId,
        file_path: filePath,
        file_name: file.name,
        file_type: "statement_pdf",
        uploaded_by: userId, // null for admin, user_id for fiscal users
      });

    if (insertError) {
      console.error("Database insert error:", insertError);
      // Try to clean up uploaded file
      await supabaseAdmin.storage.from("fiscal-files").remove([filePath]);
      return new Response(
        JSON.stringify({ error: `Erro ao salvar registro: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("File record created successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        filePath,
        message: "Arquivo enviado com sucesso" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: `Erro inesperado: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
