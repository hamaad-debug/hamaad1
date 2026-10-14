import { CapabilityItem, CapabilityRating, UserSpecs } from '../types';

export function evaluateCapabilities(specs: UserSpecs): CapabilityItem[] {
  const items: CapabilityItem[] = [];

  const isHdd = specs.primaryStorageType === 'hdd';
  const hasLowRam = specs.ramGb <= 4;
  const hasModerateRam = specs.ramGb === 8;
  const hasAmpleRam = specs.ramGb >= 16;
  const isDedicatedGpu = !specs.isIntegratedGpu;
  const isOldCpu = specs.cpuScore < 6000;
  const isModernFastCpu = specs.cpuScore >= 18000;

  // 1. EVERYDAY TASKS & MULTITASKING
  {
    let rating: CapabilityRating = 'excellent';
    let label = 'Flawless';
    let summary = '';
    const details: string[] = [];
    let bottleneck: string | undefined;

    if (isHdd && hasLowRam) {
      rating = 'limited';
      label = 'Sluggish & Constrained';
      summary = 'Noticeable delays when booting, launching browsers, or switching windows.';
      bottleneck = 'Mechanical hard drive (HDD) combined with 4GB RAM causes severe disk thrashing.';
      details.push('Web pages with dynamic video/scripts will cause stutter.');
      details.push('Opening more than 4-5 tabs will cause memory swapping to the slow disk.');
    } else if (isHdd) {
      rating = 'compromise';
      label = 'Functional but Slow Loading';
      summary = 'Handles browsing, YouTube, and documents once loaded, but startup and initial launch are slow.';
      bottleneck = 'Slow storage read/write speeds from traditional rotating HDD platter.';
      details.push('Windows updates and antivirus scans will cause system freezes.');
      details.push('8GB+ RAM prevents immediate memory exhaustion.');
    } else if (hasModerateRam) {
      rating = 'capable';
      label = 'Smooth Everyday Performance';
      summary = 'Great for web browsing, office documents, YouTube 4K streaming, and online classes.';
      details.push('Handles 15-20 browser tabs and simultaneous video calls comfortably.');
      details.push('SSD ensures snappy 10-15s boot times and instant app launching.');
      if (specs.ramChannels === 'single') {
        details.push('Single-channel RAM slightly reduces memory throughput during heavy multitasking.');
      }
    } else {
      rating = 'excellent';
      label = 'Instantaneous & Seamless';
      summary = 'Zero slowdowns. Can keep dozens of browser tabs open across multiple virtual desktops.';
      details.push('Ample RAM and fast SSD allow fluid background multitasking.');
      details.push('Crisp 4K video playback with zero frame drops.');
    }

    items.push({
      id: 'everyday_tasks',
      title: 'Everyday Computing & Browsing',
      rating,
      ratingLabel: label,
      summary,
      keyBottleneck: bottleneck,
      realWorldDetails: details,
      recommendedSettings: isHdd ? 'Migrate OS to a solid-state drive (SSD) for an instant 5x speed boost' : undefined,
    });
  }

  // 2. PROGRAMMING & SOFTWARE DEVELOPMENT
  {
    let rating: CapabilityRating = 'capable';
    let label = 'Well Suited for Web & Scripting';
    let summary = '';
    const details: string[] = [];
    let bottleneck: string | undefined;

    if (hasLowRam || isOldCpu) {
      rating = 'limited';
      label = 'Basic Scripting Only';
      summary = 'Sufficient for learning basic Python scripts, HTML/CSS, and small scripts in lightweight editors.';
      bottleneck = hasLowRam ? '4GB RAM cannot comfortably host modern IDEs (VS Code) + web browsers together.' : 'Older CPU limits compilation speed.';
      details.push('Heavy IDEs like IntelliJ or Visual Studio will feel heavy and unresponsive.');
      details.push('Running Docker or emulators is practically out of the question.');
    } else if (hasModerateRam) {
      rating = 'capable';
      label = 'Solid for Web & General Development';
      summary = 'Suitable for learning programming, full-stack web development (Node, React, Django), and small to mid-size codebases.';
      details.push('VS Code with multiple extensions, local dev servers, and Git work fluidly.');
      details.push('Can run 1-2 small Docker containers if background browser tabs are kept moderate.');
      bottleneck = 'Heavy container stacks (Docker Desktop + Kubernetes) or VirtualBox VMs will exhaust 8GB RAM.';
    } else if (hasAmpleRam && isModernFastCpu) {
      rating = 'excellent';
      label = 'Heavy Engineering Workstation';
      summary = 'Exceptional for large compilations, full Docker container networks, WSL2, and microservices.';
      details.push('Fast multithreaded CPU cuts compile times in Rust, C++, and TypeScript down to seconds.');
      details.push('16GB-32GB+ RAM allows running multiple virtual machines simultaneously.');
    } else {
      rating = 'capable';
      label = 'Capable Developer Rig';
      summary = 'Handles standard enterprise software engineering and scripting without friction.';
      details.push('Comfortable memory headroom for Docker containers and local databases.');
    }

    items.push({
      id: 'programming',
      title: 'Programming & Software Development',
      rating,
      ratingLabel: label,
      summary,
      keyBottleneck: bottleneck,
      realWorldDetails: details,
      recommendedSettings: hasModerateRam ? 'Upgrade to 16GB dual-channel if planning to run Docker, Android emulators, or VMs' : undefined,
    });
  }

  // 3. VIDEO EDITING & CONTENT CREATION
  {
    let rating: CapabilityRating = 'compromise';
    let label = 'Casual 1080p Only';
    let summary = '';
    const details: string[] = [];
    let bottleneck: string | undefined;

    if (specs.isIntegratedGpu && specs.gpuScore < 3000) {
      rating = 'limited';
      label = 'Basic Clips & CapCut';
      summary = 'Basic 1080p video cutting and trimming is possible in lightweight editors like CapCut or Clipchamp.';
      bottleneck = 'Integrated graphics lacks dedicated VRAM; timeline effects and color grading rely on slow shared memory.';
      details.push('4K timeline scrubbing will suffer severe frame stutter.');
      details.push('DaVinci Resolve will likely display GPU Memory Full or render warnings.');
    } else if (specs.isIntegratedGpu && specs.gpuScore >= 3000) {
      rating = 'compromise';
      label = 'Functional 1080p / Light 4K Playback';
      summary = 'Capable of smooth 1080p timeline editing with basic color grading and titles.';
      bottleneck = 'Demanding multi-track 4K projects will experience timeline lag without pre-rendered proxies.';
      details.push('Modern media engine decodes H.264 / H.265 video smoothly in hardware.');
      details.push('Exporting longer videos will take 2-3x real-time duration.');
    } else if (isDedicatedGpu && specs.gpuVramGb >= 6 && specs.ramGb >= 16) {
      rating = isModernFastCpu && specs.gpuVramGb >= 8 ? 'excellent' : 'capable';
      label = isModernFastCpu && specs.gpuVramGb >= 8 ? 'Pro-Level 4K Timeline' : 'Smooth 1080p / 4K with Proxies';
      summary = 'Dedicated GPU VRAM and video encoders deliver smooth scrubbing in Premiere Pro and DaVinci Resolve.';
      details.push(`Dedicated ${specs.gpuVramGb}GB VRAM accelerates timeline transforms, denoise filters, and Lumetri color.`);
      details.push('Hardware NVENC / AMF / Apple VideoToolbox delivers rapid export rendering.');
      if (specs.ramGb < 32) {
        details.push('For uncompressed 4K multicam, 32GB RAM is optimal to prevent scratch disk paging.');
      }
    } else {
      rating = 'compromise';
      label = 'Moderate 1080p Capability';
      summary = 'Good for YouTube 1080p video production. Complex fusion effects or 4K will require proxy generation.';
      bottleneck = specs.gpuVramGb < 4 ? 'Low VRAM restricts video effect cache buffer.' : undefined;
      details.push('Proxy workflows make editing smooth even on heavier files.');
    }

    items.push({
      id: 'video_editing',
      title: 'Video Editing & Content Creation',
      rating,
      ratingLabel: label,
      summary,
      keyBottleneck: bottleneck,
      realWorldDetails: details,
      recommendedSettings: specs.gpuVramGb < 6 ? 'Generate 720p ProRes / DNxHR proxies inside your video editor for smooth timeline playback' : undefined,
    });
  }

  // 4. 3D MODELING & RENDERING (BLENDER / CAD)
  {
    let rating: CapabilityRating = 'limited';
    let label = 'Low-Poly & Viewport Only';
    let summary = '';
    const details: string[] = [];
    let bottleneck: string | undefined;

    if (specs.isIntegratedGpu && specs.gpuScore < 5000) {
      rating = 'limited';
      label = 'Low-Poly Modeling Only';
      summary = 'Fine for learning 3D concepts, basic low-poly meshes, and CAD 2D drafting in FreeCAD/Fusion 360.';
      bottleneck = 'Lack of hardware raytracing cores or dedicated VRAM means Cycles rendering relies on CPU and takes hours.';
      details.push('Eevee viewport runs at lower framerates with shadows enabled.');
      details.push('Complex sculpting with high polygon counts will cause viewport lag.');
    } else if (isDedicatedGpu && specs.gpuTier >= 3) {
      rating = specs.gpuTier >= 4 ? 'excellent' : 'capable';
      label = specs.gpuTier >= 4 ? 'High-Performance 3D Workstation' : 'Smooth Viewport & Fast Cycles Render';
      summary = 'Strong performance in Blender, 3ds Max, and Unreal Engine viewport.';
      details.push(`Hardware acceleration (OptiX / HIP / Metal) slashes final render times from hours to minutes.`);
      details.push(`${specs.gpuVramGb}GB VRAM allows complex PBR material textures and large geometry without crash.`);
    } else {
      rating = 'compromise';
      label = 'Moderate 3D Capability';
      summary = 'Solid for intermediate Blender modeling, 3D printing prep, and basic Eevee viewport rendering.';
      bottleneck = 'Cycles path-tracing rendering will still require patience on complex scenes.';
      details.push('Keep viewport shading in Solid or Material Preview mode while working on meshes.');
    }

    items.push({
      id: 'modeling_3d',
      title: '3D Modeling & Rendering (Blender/CAD)',
      rating,
      ratingLabel: label,
      summary,
      keyBottleneck: bottleneck,
      realWorldDetails: details,
      recommendedSettings: 'Use OptiX / HIP hardware rendering in Blender Preferences > System',
    });
  }

  // 5. GAMING
  {
    let rating: CapabilityRating = 'compromise';
    let label = 'Casual & Lightweight Games';
    let summary = '';
    const details: string[] = [];
    let bottleneck: string | undefined;

    if (specs.isIntegratedGpu && specs.gpuScore < 1500) {
      rating = 'limited';
      label = 'Indies & Retro Classics Only';
      summary = 'Suitable for 2D indies (Stardew Valley, Terraria, Balatro), older classics (GTA San Andreas, TF2), and web games.';
      bottleneck = 'Older integrated GPU cannot sustain playable framerates in modern 3D games even at lowest settings.';
      details.push('Competitive titles like CS2 will struggle below 30-40 FPS with heavy input lag.');
      details.push('Valorant is playable at 720p or 1080p Low.');
    } else if (specs.isIntegratedGpu && specs.gpuScore >= 1500 && specs.gpuScore < 5000) {
      rating = 'compromise';
      label = 'Casual & Esports at 720p/1080p Low';
      summary = 'Plays Valorant, League of Legends, Rocket League, and GTA V smoothly at modest settings.';
      bottleneck = 'Modern graphically demanding AAA titles (Cyberpunk, Elden Ring) fall below minimum performance thresholds.';
      details.push('FSR (FidelityFX Super Resolution) can make some newer titles playable.');
    } else if (specs.gpuTier === 2) {
      rating = 'capable';
      label = 'Solid 1080p Esports & Older AAAs';
      summary = 'High 60-120+ FPS in CS2, Valorant, Overwatch 2, Apex, and playable 45-60 FPS in GTA V and The Witcher 3.';
      details.push('Modern AAA titles will require 1080p Low/Medium settings.');
      bottleneck = specs.gpuVramGb <= 4 ? '4GB VRAM triggers texture pop-in in recent 2023+ AAA titles.' : undefined;
    } else if (specs.gpuTier === 3) {
      rating = 'capable';
      label = 'High 1080p / Entry 1440p Gaming';
      summary = 'Can play almost all modern games at 1080p High/Ultra (60-120+ FPS), with DLSS/FSR support.';
      details.push('Cyberpunk, Baldur\'s Gate 3, and Elden Ring run at smooth 60+ FPS with balanced settings.');
      details.push('Ray tracing is feasible in lighter implementations with upscaling enabled.');
    } else {
      rating = 'excellent';
      label = 'High-End 1440p / 4K Enthusiast Gaming';
      summary = 'Destroys any modern game at max settings with high framerates and full ray tracing.';
      details.push('Smooth 60-144+ FPS in graphically intense open-world games.');
      details.push('DLSS Frame Generation and high VRAM ensure future-proof performance.');
    }

    items.push({
      id: 'gaming',
      title: 'Gaming & Interactive Entertainment',
      rating,
      ratingLabel: label,
      summary,
      keyBottleneck: bottleneck,
      realWorldDetails: details,
      recommendedSettings: specs.gpuTier <= 2 ? 'Enable AMD FSR or Intel XeSS upscaling and lock framerate to 60 FPS' : undefined,
    });
  }

  // 6. LOCAL AI & MACHINE LEARNING
  {
    let rating: CapabilityRating = 'unsupported';
    let label = 'Not Recommended for Local AI';
    let summary = '';
    const details: string[] = [];
    let bottleneck: string | undefined;

    if (specs.isIntegratedGpu || specs.gpuVramGb < 6) {
      if (specs.ramGb >= 16) {
        rating = 'compromise';
        label = 'CPU-Only Inference (Slow)';
        summary = 'Can run quantized 7B/8B parameter models (e.g. Llama 3 8B Q4 via Ollama) on CPU, but generation will be modest (4-8 tokens/sec).';
        bottleneck = 'Lack of high-bandwidth dedicated GPU VRAM forces slow system memory bus transfers.';
        details.push('Stable Diffusion image generation will take 30-90 seconds per image on CPU.');
      } else {
        rating = 'unsupported';
        label = 'Insufficient Hardware for Local AI';
        summary = 'Running modern LLMs or Stable Diffusion locally will freeze the machine due to high memory demands.';
        bottleneck = '8GB or less system memory cannot accommodate model weights and OS memory concurrently.';
        details.push('Cloud-based AI APIs or web services are strongly recommended instead.');
      }
    } else if (specs.gpuVramGb >= 12 && specs.ramGb >= 16) {
      rating = 'excellent';
      label = 'High-Speed Local AI Station';
      summary = `With ${specs.gpuVramGb}GB dedicated VRAM, can fit quantized 8B-14B models entirely into ultra-fast VRAM at 40-70 tokens/sec.`;
      details.push('Runs Stable Diffusion XL / Flux Schnell in 2-4 seconds per batch.');
      details.push('Local retrieval-augmented generation (RAG) and embeddings run effortlessly.');
    } else {
      rating = 'capable';
      label = 'Capable for 7B/8B Models';
      summary = `Can comfortably load 7B/8B parameter 4-bit quantized models into ${specs.gpuVramGb}GB VRAM for rapid responses (25-35 tokens/sec).`;
      details.push('Stable Diffusion 1.5 runs in ~4-6 seconds per 512x512 image.');
      bottleneck = 'Cannot fit larger 13B or 70B models into VRAM without CPU offloading.';
    }

    items.push({
      id: 'local_ai',
      title: 'Local AI & Machine Learning',
      rating,
      ratingLabel: label,
      summary,
      keyBottleneck: bottleneck,
      realWorldDetails: details,
      recommendedSettings: specs.gpuVramGb >= 8 ? 'Use Ollama with Ollama-WebUI or LM Studio utilizing GPU acceleration' : 'Use cloud API services rather than local weights',
    });
  }

  // 7. AUDIO PRODUCTION & RECORDING
  {
    let rating: CapabilityRating = 'capable';
    let label = 'Good for Home Recording & Beats';
    let summary = '';
    const details: string[] = [];
    let bottleneck: string | undefined;

    if (isHdd) {
      rating = 'compromise';
      label = 'Slow Sample Loading';
      summary = 'DAWs like FL Studio and Ableton will work, but loading sample libraries or Kontakt instruments will take minutes.';
      bottleneck = 'Slow storage access times delay audio sample streaming from disk.';
      details.push('SSD upgrade will make instrument loading instantaneous.');
    } else if (hasLowRam) {
      rating = 'limited';
      label = 'Restricted Track Count';
      summary = 'Suitable for basic vocal recording and small beat projects with few virtual instruments.';
      bottleneck = '4GB RAM limits polyphony and multi-gigabyte orchestral sound packs.';
    } else if (hasAmpleRam && !isHdd) {
      rating = 'excellent';
      label = 'Professional DAW Workstation';
      summary = 'Effortlessly handles 60+ multitrack sessions, heavy VST chains (FabFilter, Serum, Ozone), and low ASIO buffer latencies.';
      details.push('Near-zero audio buffer under-runs and click-free recording.');
      details.push('Sample libraries stream from fast NVMe storage instantaneously.');
    } else {
      rating = 'capable';
      label = 'Solid Home Studio Rig';
      summary = 'Great for music production, podcasts, guitar amp simulators, and beatmaking.';
      details.push('Can handle 25-40 tracks with standard stock effects and virtual synths.');
    }

    items.push({
      id: 'audio_production',
      title: 'Music Production & Audio Engineering',
      rating,
      ratingLabel: label,
      summary,
      keyBottleneck: bottleneck,
      realWorldDetails: details,
      recommendedSettings: 'Set ASIO audio driver buffer size to 128 or 256 samples for sub-10ms monitoring latency',
    });
  }

  return items;
}
